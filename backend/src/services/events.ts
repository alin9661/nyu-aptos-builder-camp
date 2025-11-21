import { Response } from 'express';
import { logger } from '../utils/logger';

// Event Types - same as before
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

// Event payload interfaces (same as WebSocket version)
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

// SSE Connection tracking
interface SSEConnection {
  id: string;
  response: Response;
  channels: Set<string>;
  address: string;
  authenticated: boolean;
  connectedAt: number;
}

// Connection metrics
interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  totalEvents: number;
  eventsByChannel: Record<string, number>;
  connectionsByChannel: Record<string, Set<string>>;
}

// Event store for recent events (allows polling fallback)
interface StoredEvent {
  id: string;
  channel: EventChannel;
  data: any;
  timestamp: number;
}

/**
 * Server-Sent Events (SSE) Service
 * Replaces WebSocket functionality with SSE for Vercel compatibility
 */
export class EventService {
  private connections: Map<string, SSEConnection> = new Map();
  private metrics: ConnectionMetrics;
  private eventHistory: StoredEvent[] = [];
  private readonly MAX_HISTORY = 100;
  private readonly EVENT_RETENTION_MS = 60000; // 1 minute

  constructor() {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalEvents: 0,
      eventsByChannel: {},
      connectionsByChannel: {},
    };

    // Cleanup old events periodically
    setInterval(() => this.cleanupOldEvents(), 30000);

    logger.info('SSE Event service initialized');
  }

  /**
   * Register a new SSE connection
   */
  public registerConnection(
    connectionId: string,
    res: Response,
    channels: string[],
    address: string = 'anonymous',
    authenticated: boolean = false
  ): void {
    // Setup SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create connection
    const connection: SSEConnection = {
      id: connectionId,
      response: res,
      channels: new Set(channels),
      address,
      authenticated,
      connectedAt: Date.now(),
    };

    this.connections.set(connectionId, connection);
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;

    // Track channels
    channels.forEach((channel) => {
      if (!this.metrics.connectionsByChannel[channel]) {
        this.metrics.connectionsByChannel[channel] = new Set();
      }
      this.metrics.connectionsByChannel[channel].add(connectionId);
    });

    logger.info('SSE client connected', {
      connectionId,
      address,
      authenticated,
      channels,
      activeConnections: this.metrics.activeConnections,
    });

    // Send initial connection event
    this.sendToConnection(connectionId, 'connected', {
      connectionId,
      channels: Array.from(channels),
      timestamp: Date.now(),
    });

    // Handle client disconnect
    res.on('close', () => {
      this.removeConnection(connectionId);
    });

    // Send keepalive pings every 30 seconds
    const keepaliveInterval = setInterval(() => {
      if (this.connections.has(connectionId)) {
        this.sendToConnection(connectionId, 'ping', { timestamp: Date.now() });
      } else {
        clearInterval(keepaliveInterval);
      }
    }, 30000);
  }

  /**
   * Remove a connection
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.connections.delete(connectionId);
    this.metrics.activeConnections--;

    // Remove from channel tracking
    Object.keys(this.metrics.connectionsByChannel).forEach((channel) => {
      this.metrics.connectionsByChannel[channel]?.delete(connectionId);
    });

    logger.info('SSE client disconnected', {
      connectionId,
      address: connection.address,
      activeConnections: this.metrics.activeConnections,
    });
  }

  /**
   * Send event to a specific connection
   */
  private sendToConnection(connectionId: string, event: string, data: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      const sseData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.response.write(sseData);
    } catch (error) {
      logger.error('Failed to send SSE event', {
        connectionId,
        event,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.removeConnection(connectionId);
    }
  }

  /**
   * Broadcast event to all connections subscribed to a channel
   */
  private broadcastToChannel(channel: EventChannel, data: any): void {
    const subscriberIds = this.metrics.connectionsByChannel[channel];
    if (!subscriberIds) return;

    const eventData = {
      ...data,
      channel,
      emittedAt: Date.now(),
    };

    let successCount = 0;
    subscriberIds.forEach((connectionId) => {
      const connection = this.connections.get(connectionId);
      if (connection && connection.channels.has(channel)) {
        this.sendToConnection(connectionId, channel, eventData);
        successCount++;
      }
    });

    logger.debug('Event broadcasted to channel', {
      channel,
      subscribers: successCount,
    });
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

      // Broadcast to SSE connections
      this.broadcastToChannel(channel, data);

      // Update metrics
      this.metrics.totalEvents++;
      this.metrics.eventsByChannel[channel] =
        (this.metrics.eventsByChannel[channel] || 0) + 1;
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

  /**
   * Get current metrics
   */
  public getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      connectionsByChannel: Object.fromEntries(
        Object.entries(this.metrics.connectionsByChannel).map(([k, v]) => [k, v])
      ) as any,
    };
  }

  /**
   * Broadcast system message to all clients
   */
  public broadcastSystemMessage(message: string, data?: any): void {
    this.connections.forEach((connection) => {
      this.sendToConnection(connection.id, 'system:message', {
        message,
        data,
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Shutdown gracefully
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down Event service');

    // Notify all clients
    this.broadcastSystemMessage('Server is shutting down');

    // Close all connections
    this.connections.forEach((connection) => {
      try {
        connection.response.end();
      } catch (error) {
        // Ignore errors during shutdown
      }
    });

    this.connections.clear();
    logger.info('Event service shut down complete');
  }
}

// Singleton instance
let eventService: EventService | null = null;

export const initializeEventService = (): EventService => {
  if (eventService) {
    logger.warn('Event service already initialized');
    return eventService;
  }

  eventService = new EventService();
  return eventService;
};

export const getEventService = (): EventService => {
  if (!eventService) {
    throw new Error('Event service not initialized');
  }
  return eventService;
};
