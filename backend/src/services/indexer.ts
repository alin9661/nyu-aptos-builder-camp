import { aptos, EVENT_TYPES } from '../config/aptos';
import { query, transaction } from '../config/database';
import { logger } from '../utils/logger';
import { getEventService } from './events';

// Indexer state
interface IndexerState {
  lastProcessedVersion: bigint;
  isRunning: boolean;
  serviceName: string;
}

// Event processors
class EventIndexer {
  private state: IndexerState;
  private pollInterval: number;

  constructor(serviceName: string, pollInterval = 5000) {
    this.state = {
      lastProcessedVersion: BigInt(0),
      isRunning: false,
      serviceName,
    };
    this.pollInterval = pollInterval;
  }

  async initialize(): Promise<void> {
    try {
      // Load last processed version from database
      const result = await query<{ last_processed_version: string }>(
        'SELECT last_processed_version FROM indexer_state WHERE service_name = $1',
        [this.state.serviceName]
      );

      if (result.length > 0) {
        this.state.lastProcessedVersion = BigInt(result[0].last_processed_version);
        logger.info(`Initialized ${this.state.serviceName}`, {
          lastProcessedVersion: this.state.lastProcessedVersion.toString(),
        });
      }
    } catch (error) {
      logger.error(`Failed to initialize ${this.state.serviceName}`, { error });
      throw error;
    }
  }

  async updateState(version: bigint): Promise<void> {
    try {
      await query(
        `UPDATE indexer_state
         SET last_processed_version = $1,
             last_processed_timestamp = NOW(),
             status = 'running'
         WHERE service_name = $2`,
        [version.toString(), this.state.serviceName]
      );
      this.state.lastProcessedVersion = version;
    } catch (error) {
      logger.error(`Failed to update state for ${this.state.serviceName}`, { error });
      throw error;
    }
  }

  async start(): Promise<void> {
    if (this.state.isRunning) {
      logger.warn(`${this.state.serviceName} is already running`);
      return;
    }

    await this.initialize();
    this.state.isRunning = true;

    logger.info(`Starting ${this.state.serviceName}`);
    this.poll();
  }

  async stop(): Promise<void> {
    this.state.isRunning = false;
    await query(
      'UPDATE indexer_state SET status = $1 WHERE service_name = $2',
      ['stopped', this.state.serviceName]
    );
    logger.info(`Stopped ${this.state.serviceName}`);
  }

  private async poll(): Promise<void> {
    if (!this.state.isRunning) return;

    try {
      await this.processEvents();
    } catch (error) {
      logger.error(`Error in ${this.state.serviceName} polling`, { error });
      await query(
        `UPDATE indexer_state
         SET status = 'error',
             error_message = $1
         WHERE service_name = $2`,
        [error instanceof Error ? error.message : 'Unknown error', this.state.serviceName]
      );
    }

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollInterval);
  }

  protected async processEvents(): Promise<void> {
    // Override in subclasses
  }
}

// Treasury Indexer
class TreasuryIndexer extends EventIndexer {
  constructor() {
    super('treasury_indexer');
  }

  protected async processEvents(): Promise<void> {
    try {
      // Get latest ledger version
      const ledgerInfo = await aptos.getLedgerInfo();
      const latestVersion = BigInt(ledgerInfo.ledger_version);

      if (latestVersion <= (this as any).state.lastProcessedVersion) {
        return; // No new transactions
      }

      // Fetch events in batches
      const batchSize = 100;
      let currentVersion = (this as any).state.lastProcessedVersion + BigInt(1);

      while (currentVersion <= latestVersion) {
        const endVersion = currentVersion + BigInt(batchSize) - BigInt(1);

        // Fetch deposit events
        await this.processDepositEvents(currentVersion, endVersion);

        // Fetch reimbursement submitted events
        await this.processReimbursementSubmittedEvents(currentVersion, endVersion);

        // Fetch reimbursement approved events
        await this.processReimbursementApprovedEvents(currentVersion, endVersion);

        // Fetch reimbursement paid events
        await this.processReimbursementPaidEvents(currentVersion, endVersion);

        await this.updateState(endVersion);
        currentVersion = endVersion + BigInt(1);
      }
    } catch (error) {
      logger.error('Treasury indexer error', { error });
      throw error;
    }
  }

  private async processDepositEvents(startVersion: bigint, endVersion: bigint): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.DEPOSIT_RECEIVED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          await client.query(
            `INSERT INTO treasury_deposits
             (source, amount, total_balance, transaction_hash, version, block_height, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (transaction_hash) DO NOTHING`,
            [
              Buffer.from(data.source).toString('utf-8'),
              data.amount,
              data.total_balance,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
              new Date(parseInt(eventAny.event_index || 0) * 1000),
            ]
          );
        });

        // Emit SSE event
        try {
          const eventService = getEventService();
          eventService.emitTreasuryDeposit({
            source: Buffer.from(data.source).toString('utf-8'),
            amount: data.amount,
            totalBalance: data.total_balance,
            transactionHash: eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.debug('WebSocket service not available for deposit event');
        }

        logger.debug('Indexed deposit event', { version: eventAny.transaction_version });
      }
    } catch (error) {
      logger.error('Failed to process deposit events', { error });
    }
  }

  private async processReimbursementSubmittedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.REIMBURSEMENT_SUBMITTED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          // Ensure users exist
          await client.query(
            `INSERT INTO users (address, role)
             VALUES ($1, 'eboard_member')
             ON CONFLICT (address) DO NOTHING`,
            [data.payer]
          );

          await client.query(
            `INSERT INTO users (address, role)
             VALUES ($1, 'eboard_member')
             ON CONFLICT (address) DO NOTHING`,
            [data.payee]
          );

          // Insert reimbursement request
          await client.query(
            `INSERT INTO reimbursement_requests
             (id, payer, payee, amount, invoice_uri, invoice_hash, created_ts,
              transaction_hash, version, block_height)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [
              data.id,
              data.payer,
              data.payee,
              data.amount,
              Buffer.from(data.invoice_uri).toString('utf-8'),
              Buffer.from(data.invoice_hash).toString('hex'),
              Date.now(),
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
            ]
          );
        });

        // Emit WebSocket event
        try {
          const eventService = getEventService();
          eventService.emitReimbursementNew({
            id: data.id,
            payer: data.payer,
            payee: data.payee,
            amount: data.amount,
            invoiceUri: Buffer.from(data.invoice_uri).toString('utf-8'),
            transactionHash: eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.debug('WebSocket service not available for reimbursement submitted event');
        }

        logger.debug('Indexed reimbursement submitted event', { id: data.id });
      }
    } catch (error) {
      logger.error('Failed to process reimbursement submitted events', { error });
    }
  }

  private async processReimbursementApprovedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.REIMBURSEMENT_APPROVED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;
        const role = Buffer.from(data.role).toString('utf-8');

        await transaction(async (client) => {
          // Update request approval status
          const columnMap: Record<string, string> = {
            ADVISOR: 'approved_advisor',
            PRESIDENT: 'approved_president',
            VICE: 'approved_vice',
          };

          const column = columnMap[role];
          if (column) {
            await client.query(
              `UPDATE reimbursement_requests
               SET ${column} = true
               WHERE id = $1`,
              [data.id]
            );
          }

          // Insert approval record
          await client.query(
            `INSERT INTO reimbursement_approvals
             (request_id, approver, role, transaction_hash, version, block_height, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (transaction_hash) DO NOTHING`,
            [
              data.id,
              data.approver,
              role,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
              new Date(),
            ]
          );

          // Get current approval status
          const statusResult = await client.query(
            `SELECT approved_advisor, approved_president, approved_vice
             FROM reimbursement_requests
             WHERE id = $1`,
            [data.id]
          );

          // Emit WebSocket event
          try {
            const eventService = getEventService();
            const approvalStatus = statusResult.rows[0];
            eventService.emitReimbursementApproved({
              id: data.id,
              approver: data.approver,
              role,
              approved: {
                advisor: approvalStatus.approved_advisor || false,
                president: approvalStatus.approved_president || false,
                vice: approvalStatus.approved_vice || false,
              },
              fullyApproved:
                approvalStatus.approved_advisor &&
                approvalStatus.approved_president &&
                approvalStatus.approved_vice,
              transactionHash: eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            logger.debug('WebSocket service not available for reimbursement approval event');
          }
        });

        logger.debug('Indexed reimbursement approval', { id: data.id, role });
      }
    } catch (error) {
      logger.error('Failed to process reimbursement approved events', { error });
    }
  }

  private async processReimbursementPaidEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.REIMBURSEMENT_PAID },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          // Update request status
          await client.query(
            `UPDATE reimbursement_requests
             SET paid_out = true
             WHERE id = $1`,
            [data.id]
          );

          // Insert payment record
          await client.query(
            `INSERT INTO reimbursement_payments
             (request_id, payee, amount, transaction_hash, version, block_height, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (request_id) DO NOTHING`,
            [
              data.id,
              data.payee,
              data.amount,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
              new Date(),
            ]
          );
        });

        // Emit WebSocket event
        try {
          const eventService = getEventService();
          eventService.emitReimbursementPaid({
            id: data.id,
            payee: data.payee,
            amount: data.amount,
            transactionHash: eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.debug('WebSocket service not available for reimbursement payment event');
        }

        logger.debug('Indexed reimbursement payment', { id: data.id });
      }
    } catch (error) {
      logger.error('Failed to process reimbursement paid events', { error });
    }
  }
}

// Governance Indexer
class GovernanceIndexer extends EventIndexer {
  constructor() {
    super('governance_indexer');
  }

  protected async processEvents(): Promise<void> {
    try {
      const ledgerInfo = await aptos.getLedgerInfo();
      const latestVersion = BigInt(ledgerInfo.ledger_version);

      if (latestVersion <= (this as any).state.lastProcessedVersion) {
        return;
      }

      const batchSize = 100;
      let currentVersion = (this as any).state.lastProcessedVersion + BigInt(1);

      while (currentVersion <= latestVersion) {
        const endVersion = currentVersion + BigInt(batchSize) - BigInt(1);

        // Process candidate added events
        await this.processCandidateAddedEvents(currentVersion, endVersion);

        // Process vote cast events
        await this.processVoteCastEvents(currentVersion, endVersion);

        // Process election finalized events
        await this.processElectionFinalizedEvents(currentVersion, endVersion);

        await this.updateState(endVersion);
        currentVersion = endVersion + BigInt(1);
      }
    } catch (error) {
      logger.error('Governance indexer error', { error });
      throw error;
    }
  }

  private async processCandidateAddedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.CANDIDATE_ADDED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          // Ensure election exists
          await client.query(
            `INSERT INTO elections (election_id, role_name, start_ts, end_ts, transaction_hash, version, block_height)
             VALUES ($1, $2, 0, 0, $3, $4, $5)
             ON CONFLICT (election_id, role_name) DO NOTHING`,
            [
              data.election_id,
              Buffer.from(data.role_name).toString('utf-8'),
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
            ]
          );

          // Insert candidate
          await client.query(
            `INSERT INTO election_candidates
             (election_id, role_name, candidate, transaction_hash, version, block_height, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (transaction_hash) DO NOTHING`,
            [
              data.election_id,
              Buffer.from(data.role_name).toString('utf-8'),
              data.candidate,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
              new Date(),
            ]
          );
        });

        logger.debug('Indexed candidate added', { election_id: data.election_id });
      }
    } catch (error) {
      logger.error('Failed to process candidate added events', { error });
    }
  }

  private async processVoteCastEvents(startVersion: bigint, endVersion: bigint): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.VOTE_CAST_GOVERNANCE },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          await client.query(
            `INSERT INTO election_votes
             (election_id, role_name, voter, candidate, weight, transaction_hash, version, block_height, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (election_id, role_name, voter) DO NOTHING`,
            [
              data.election_id,
              Buffer.from(data.role_name).toString('utf-8'),
              data.voter,
              data.candidate,
              data.weight,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
              new Date(),
            ]
          );
        });

        // Emit WebSocket event
        try {
          const eventService = getEventService();
          eventService.emitElectionVote({
            electionId: data.election_id,
            roleName: Buffer.from(data.role_name).toString('utf-8'),
            voter: data.voter,
            candidate: data.candidate,
            weight: data.weight,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.debug('WebSocket service not available for election vote event');
        }

        logger.debug('Indexed governance vote', { election_id: data.election_id });
      }
    } catch (error) {
      logger.error('Failed to process vote cast events', { error });
    }
  }

  private async processElectionFinalizedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.ELECTION_FINALIZED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;

        await transaction(async (client) => {
          await client.query(
            `UPDATE elections
             SET finalized = true,
                 winner = $1,
                 is_tie = $2
             WHERE election_id = $3 AND role_name = $4`,
            [
              data.winner?.vec?.[0] || null,
              data.is_tie,
              data.election_id,
              Buffer.from(data.role_name).toString('utf-8'),
            ]
          );

          // Get total votes count
          const voteCountResult = await client.query(
            `SELECT COUNT(*) as total_votes
             FROM election_votes
             WHERE election_id = $1 AND role_name = $2`,
            [data.election_id, Buffer.from(data.role_name).toString('utf-8')]
          );

          // Emit WebSocket event
          try {
            const eventService = getEventService();
            eventService.emitElectionFinalized({
              electionId: data.election_id,
              roleName: Buffer.from(data.role_name).toString('utf-8'),
              winner: data.winner?.vec?.[0] || null,
              isTie: data.is_tie,
              totalVotes: parseInt(voteCountResult.rows[0].total_votes),
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            logger.debug('WebSocket service not available for election finalized event');
          }
        });

        logger.debug('Indexed election finalized', { election_id: data.election_id });
      }
    } catch (error) {
      logger.error('Failed to process election finalized events', { error });
    }
  }
}

// Proposals Indexer
class ProposalsIndexer extends EventIndexer {
  constructor() {
    super('proposals_indexer');
  }

  protected async processEvents(): Promise<void> {
    try {
      const ledgerInfo = await aptos.getLedgerInfo();
      const latestVersion = BigInt(ledgerInfo.ledger_version);

      if (latestVersion <= (this as any).state.lastProcessedVersion) {
        return;
      }

      const batchSize = 100;
      let currentVersion = (this as any).state.lastProcessedVersion + BigInt(1);

      while (currentVersion <= latestVersion) {
        const endVersion = currentVersion + BigInt(batchSize) - BigInt(1);

        await this.processProposalCreatedEvents(currentVersion, endVersion);
        await this.processProposalVoteEvents(currentVersion, endVersion);
        await this.processProposalFinalizedEvents(currentVersion, endVersion);
        await this.processProposalExecutedEvents(currentVersion, endVersion);

        await this.updateState(endVersion);
        currentVersion = endVersion + BigInt(1);
      }
    } catch (error) {
      logger.error('Proposals indexer error', { error });
      throw error;
    }
  }

  private async processProposalCreatedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.PROPOSAL_CREATED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          await client.query(
            `INSERT INTO proposals
             (proposal_id, creator, title, description, start_ts, end_ts, status,
              transaction_hash, version, block_height)
             VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8, $9)
             ON CONFLICT (proposal_id) DO NOTHING`,
            [
              data.proposal_id,
              data.creator,
              Buffer.from(data.title).toString('utf-8'),
              '', // Description not in event
              data.start_ts,
              data.end_ts,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
            ]
          );
        });

        // Emit WebSocket event
        try {
          const eventService = getEventService();
          eventService.emitProposalNew({
            proposalId: data.proposal_id,
            creator: data.creator,
            title: Buffer.from(data.title).toString('utf-8'),
            description: '', // Description not in event
            startTs: data.start_ts,
            endTs: data.end_ts,
            transactionHash: eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.debug('WebSocket service not available for proposal created event');
        }

        logger.debug('Indexed proposal created', { proposal_id: data.proposal_id });
      }
    } catch (error) {
      logger.error('Failed to process proposal created events', { error });
    }
  }

  private async processProposalVoteEvents(startVersion: bigint, endVersion: bigint): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.VOTE_CAST_PROPOSAL },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;
        const eventAny = event as any;

        await transaction(async (client) => {
          await client.query(
            `INSERT INTO proposal_votes
             (proposal_id, voter, vote, weight, transaction_hash, version, block_height, timestamp)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (proposal_id, voter) DO NOTHING`,
            [
              data.proposal_id,
              data.voter,
              data.vote,
              data.weight,
              eventAny.transaction_hash || eventAny.indexed_at_transaction_hash,
              eventAny.transaction_version || eventAny.indexed_at_transaction_version,
              eventAny.transaction_block_height || eventAny.indexed_at_block_height,
              new Date(),
            ]
          );

          // Update proposal vote counts
          const voteField = data.vote ? 'yay_votes' : 'nay_votes';
          await client.query(
            `UPDATE proposals
             SET ${voteField} = ${voteField} + $1
             WHERE proposal_id = $2`,
            [data.weight, data.proposal_id]
          );

          // Get updated vote counts
          const voteCountResult = await client.query(
            `SELECT yay_votes, nay_votes FROM proposals WHERE proposal_id = $1`,
            [data.proposal_id]
          );

          // Emit WebSocket event
          try {
            const eventService = getEventService();
            const voteCounts = voteCountResult.rows[0];
            eventService.emitProposalVote({
              proposalId: data.proposal_id,
              voter: data.voter,
              vote: data.vote,
              weight: data.weight,
              yayVotes: voteCounts.yay_votes,
              nayVotes: voteCounts.nay_votes,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            logger.debug('WebSocket service not available for proposal vote event');
          }
        });

        logger.debug('Indexed proposal vote', { proposal_id: data.proposal_id });
      }
    } catch (error) {
      logger.error('Failed to process proposal vote events', { error });
    }
  }

  private async processProposalFinalizedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.PROPOSAL_FINALIZED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;

        await transaction(async (client) => {
          await client.query(
            `UPDATE proposals
             SET finalized = true,
                 status = $1,
                 yay_votes = $2,
                 nay_votes = $3
             WHERE proposal_id = $4`,
            [data.status, data.yay_votes, data.nay_votes, data.proposal_id]
          );
        });

        // Emit WebSocket event
        try {
          const eventService = getEventService();
          eventService.emitProposalFinalized({
            proposalId: data.proposal_id,
            status: data.status,
            yayVotes: data.yay_votes,
            nayVotes: data.nay_votes,
            passed: data.status === 2 || data.status === 4, // 2=Approved, 4=Executed
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          logger.debug('WebSocket service not available for proposal finalized event');
        }

        logger.debug('Indexed proposal finalized', { proposal_id: data.proposal_id });
      }
    } catch (error) {
      logger.error('Failed to process proposal finalized events', { error });
    }
  }

  private async processProposalExecutedEvents(
    startVersion: bigint,
    endVersion: bigint
  ): Promise<void> {
    try {
      const events = await aptos.getEvents({
        options: {
          where: {
            transaction_version: {
              _gte: startVersion.toString(),
              _lte: endVersion.toString(),
            },
            type: { _eq: EVENT_TYPES.PROPOSAL_EXECUTED },
          },
        },
      });

      for (const event of events) {
        const data = event.data as any;

        await transaction(async (client) => {
          await client.query(
            `UPDATE proposals
             SET executed = true,
                 status = 4
             WHERE proposal_id = $1`,
            [data.proposal_id]
          );
        });

        logger.debug('Indexed proposal executed', { proposal_id: data.proposal_id });
      }
    } catch (error) {
      logger.error('Failed to process proposal executed events', { error });
    }
  }
}

// Main indexer service
export class IndexerService {
  private treasuryIndexer: TreasuryIndexer;
  private governanceIndexer: GovernanceIndexer;
  private proposalsIndexer: ProposalsIndexer;

  constructor() {
    this.treasuryIndexer = new TreasuryIndexer();
    this.governanceIndexer = new GovernanceIndexer();
    this.proposalsIndexer = new ProposalsIndexer();
  }

  async start(): Promise<void> {
    logger.info('Starting indexer service');

    await this.treasuryIndexer.start();
    await this.governanceIndexer.start();
    await this.proposalsIndexer.start();

    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  async stop(): Promise<void> {
    logger.info('Stopping indexer service');

    await this.treasuryIndexer.stop();
    await this.governanceIndexer.stop();
    await this.proposalsIndexer.stop();
  }
}

// Run indexer if called directly
if (require.main === module) {
  const indexer = new IndexerService();
  indexer.start().catch((error) => {
    logger.error('Failed to start indexer', { error });
    process.exit(1);
  });
}
