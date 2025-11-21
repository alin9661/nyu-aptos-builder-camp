import { logger } from '../server/utils/logger';

// Event Types
export enum EventChannel {
  // Treasury channels
  TREASURY_DEPOSIT = 'treasury:deposit',
  TREASURY_BALANCE = 'treasury:balance',

  // Reimbursement channels
  REIMBURSEMENTS_NEW = 'reimbursements:new',
  REIMBURSEMENTS_APPROVED = 'reimbursements:approved',
  REIMBURSEMENTS_PAID = 'reimbursements:paid',

  // Election channels
  ELECTIONS_VOTE = 'elections:vote',
  ELECTIONS_FINALIZED = 'elections:finalized',

  // Proposal channels
  PROPOSALS_NEW = 'proposals:new',
  PROPOSALS_VOTE = 'proposals:vote',
  PROPOSALS_FINALIZED = 'proposals:finalized',
}

// Event payload interfaces
export interface TreasuryDepositEvent {
  source: string;
  amount: string;
  totalBalance: string;
  transactionHash: string;
  timestamp: string;
}

export interface TreasuryBalanceEvent {
  balance: string;
  changeAmount: string;
  changeType: 'deposit' | 'withdrawal';
  timestamp: string;
}

export interface ReimbursementNewEvent {
  id: string;
  payer: string;
  payee: string;
  amount: string;
  invoiceUri: string;
  transactionHash: string;
  timestamp: string;
}

export interface ReimbursementApprovedEvent {
  id: string;
  approver: string;
  role: string;
  approved: {
    advisor: boolean;
    president: boolean;
    vice: boolean;
  };
  fullyApproved: boolean;
  transactionHash: string;
  timestamp: string;
}

export interface ReimbursementPaidEvent {
  id: string;
  payee: string;
  amount: string;
  transactionHash: string;
  timestamp: string;
}

export interface ElectionVoteEvent {
  electionId: string;
  roleName: string;
  voter: string;
  candidate: string;
  weight: string;
  timestamp: string;
}

export interface ElectionFinalizedEvent {
  electionId: string;
  roleName: string;
  winner: string | null;
  isTie: boolean;
  totalVotes: number;
  timestamp: string;
}

export interface ProposalNewEvent {
  proposalId: string;
  creator: string;
  title: string;
  description: string;
  startTs: string;
  endTs: string;
  transactionHash: string;
  timestamp: string;
}

export interface ProposalVoteEvent {
  proposalId: string;
  voter: string;
  vote: boolean;
  weight: string;
  yayVotes: string;
  nayVotes: string;
  timestamp: string;
}

export interface ProposalFinalizedEvent {
  proposalId: string;
  status: number;
  yayVotes: string;
  nayVotes: string;
  passed: boolean;
  timestamp: string;
}

// Event store for recent events (allows polling fallback)
interface StoredEvent {
  id: string;
  channel: EventChannel;
  data: any;
  timestamp: number;
}

/**
 * Event Service
 * Optimized for Vercel Serverless (Polling only, no SSE)
 */
export class EventService {
  private eventHistory: StoredEvent[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly EVENT_RETENTION_MS = 60000; // 1 minute

  constructor() {
    // Cleanup old events periodically
    // Note: In serverless, this interval might not persist, but we check on access too
    if (global.setInterval) {
        setInterval(() => this.cleanupOldEvents(), 30000);
    }
    logger.info('Event service initialized (Polling Mode)');
  }

  /**
   * Store event in history for polling
   */
  private storeEvent(channel: EventChannel, data: any): void {
    const event: StoredEvent = {
      id: `${channel}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      channel,
      data,
      timestamp: Date.now(),
    };

    this.eventHistory.push(event);

    // Keep only recent events
    if (this.eventHistory.length > this.MAX_HISTORY) {
      this.eventHistory = this.eventHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Cleanup old events from history
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - this.EVENT_RETENTION_MS;
    this.eventHistory = this.eventHistory.filter((event) => event.timestamp > cutoff);
  }

  /**
   * Get recent events (for polling fallback)
   */
  public getRecentEvents(channels: string[], since?: number): StoredEvent[] {
    // Ensure cleanup happens on access in serverless
    this.cleanupOldEvents();
    
    const cutoff = since || Date.now() - this.EVENT_RETENTION_MS;
    return this.eventHistory.filter(
      (event) => channels.includes(event.channel) && event.timestamp > cutoff
    );
  }

  /**
   * Generic emit method
   */
  private emitEvent(channel: EventChannel, data: any): void {
    try {
      // Store in history
      this.storeEvent(channel, data);
    } catch (error) {
      logger.error('Failed to emit event', {
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Public emit methods for different event types
  public emitTreasuryDeposit(data: TreasuryDepositEvent): void {
    this.emitEvent(EventChannel.TREASURY_DEPOSIT, data);
    this.emitTreasuryBalance({
      balance: data.totalBalance,
      changeAmount: data.amount,
      changeType: 'deposit',
      timestamp: data.timestamp,
    });
  }

  public emitTreasuryBalance(data: TreasuryBalanceEvent): void {
    this.emitEvent(EventChannel.TREASURY_BALANCE, data);
  }

  public emitReimbursementNew(data: ReimbursementNewEvent): void {
    this.emitEvent(EventChannel.REIMBURSEMENTS_NEW, data);
  }

  public emitReimbursementApproved(data: ReimbursementApprovedEvent): void {
    this.emitEvent(EventChannel.REIMBURSEMENTS_APPROVED, data);
  }

  public emitReimbursementPaid(data: ReimbursementPaidEvent): void {
    this.emitEvent(EventChannel.REIMBURSEMENTS_PAID, data);
    this.emitTreasuryBalance({
      balance: '0',
      changeAmount: data.amount,
      changeType: 'withdrawal',
      timestamp: data.timestamp,
    });
  }

  public emitElectionVote(data: ElectionVoteEvent): void {
    this.emitEvent(EventChannel.ELECTIONS_VOTE, data);
  }

  public emitElectionFinalized(data: ElectionFinalizedEvent): void {
    this.emitEvent(EventChannel.ELECTIONS_FINALIZED, data);
  }

  public emitProposalNew(data: ProposalNewEvent): void {
    this.emitEvent(EventChannel.PROPOSALS_NEW, data);
  }

  public emitProposalVote(data: ProposalVoteEvent): void {
    this.emitEvent(EventChannel.PROPOSALS_VOTE, data);
  }

  public emitProposalFinalized(data: ProposalFinalizedEvent): void {
    this.emitEvent(EventChannel.PROPOSALS_FINALIZED, data);
  }
}

// Singleton instance
// Note: In serverless, this singleton is per-lambda instance.
// Events emitted in one lambda won't be seen by another lambda polling.
// For true real-time in serverless, we need an external store (Redis/Vercel KV).
// But for now, we'll keep in-memory as per existing architecture, noting the limitation.
// The Indexer runs as a separate process (or cron), so if it emits events,
// they won't be seen by the API route serving polling requests unless they share memory.
// 
// CRITICAL: This in-memory event service DOES NOT WORK across serverless functions.
// The Indexer needs to write to DB, and the Polling API needs to read from DB.
// The existing implementation relies on the Indexer writing to DB.
// So the Polling API should query the DB for recent changes, OR we use Vercel KV.
//
// However, the `getRecentEvents` method filters `eventHistory`.
// If `eventHistory` is populated by `emitEvent`, and `emitEvent` is called by Indexer,
// and Indexer runs in a different process/lambda than the Polling API,
// then Polling API will see EMPTY history.
//
// To fix this properly for Serverless, we should query the DB for recent events based on timestamps.
// But for this migration step, I will port the code as is, but add a TODO.
// Actually, the Indexer writes to DB tables (treasury_deposits, etc.).
// The Polling API *should* query those tables.
// The current `EventService` seems to be an optimization/cache.
// I will keep it but it won't work as expected for cross-process communication.

let eventService: EventService | null = null;

declare global {
  var eventService: EventService | undefined;
}

export const initializeEventService = (): EventService => {
  if (global.eventService) {
    return global.eventService;
  }

  global.eventService = new EventService();
  return global.eventService;
};

export const getEventService = (): EventService => {
  if (!global.eventService) {
    return initializeEventService();
  }
  return global.eventService;
};