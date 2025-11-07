import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// WebSocket Event Types
export enum WebSocketChannel {
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

// Connection metrics
interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  totalEvents: number;
  eventsByChannel: Record<string, number>;
  connectionsByChannel: Record<string, Set<string>>;
}

// Rate limiter for WebSocket events
class WebSocketRateLimiter {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly maxEvents: number;
  private readonly windowMs: number;

  constructor(maxEvents = 100, windowMs = 60000) {
    this.maxEvents = maxEvents;
    this.windowMs = windowMs;
  }

  check(socketId: string): boolean {
    const now = Date.now();
    const limit = this.limits.get(socketId);

    if (!limit || now > limit.resetTime) {
      this.limits.set(socketId, { count: 1, resetTime: now + this.windowMs });
      return true;
    }

    if (limit.count >= this.maxEvents) {
      return false;
    }

    limit.count++;
    return true;
  }

  reset(socketId: string): void {
    this.limits.delete(socketId);
  }
}

// WebSocket Service
export class WebSocketService {
  private io: SocketIOServer;
  private metrics: ConnectionMetrics;
  private rateLimiter: WebSocketRateLimiter;
  private readonly JWT_SECRET: string;

  constructor(httpServer: HTTPServer) {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

    // Initialize Socket.IO with CORS
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    // Initialize metrics
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      totalEvents: 0,
      eventsByChannel: {},
      connectionsByChannel: {},
    };

    // Initialize rate limiter
    this.rateLimiter = new WebSocketRateLimiter();

    // Setup middleware and connection handlers
    this.setupMiddleware();
    this.setupConnectionHandlers();

    logger.info('WebSocket service initialized');
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use((socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;

        if (!token) {
          // Allow anonymous connections but mark them
          socket.data.authenticated = false;
          socket.data.address = 'anonymous';
          return next();
        }

        // Verify JWT token
        const decoded = jwt.verify(token, this.JWT_SECRET) as { address: string };
        socket.data.authenticated = true;
        socket.data.address = decoded.address;

        logger.debug('WebSocket authentication successful', {
          socketId: socket.id,
          address: decoded.address,
        });

        next();
      } catch (error) {
        logger.warn('WebSocket authentication failed', {
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        // Allow connection but mark as unauthenticated
        socket.data.authenticated = false;
        socket.data.address = 'anonymous';
        next();
      }
    });
  }

  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;

      logger.info('WebSocket client connected', {
        socketId: socket.id,
        address: socket.data.address,
        authenticated: socket.data.authenticated,
        transport: socket.conn.transport.name,
      });

      // Subscribe to channels
      socket.on('subscribe', (channels: string | string[]) => {
        this.handleSubscribe(socket, channels);
      });

      // Unsubscribe from channels
      socket.on('unsubscribe', (channels: string | string[]) => {
        this.handleUnsubscribe(socket, channels);
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.metrics.activeConnections--;
        this.rateLimiter.reset(socket.id);

        // Remove from channel tracking
        Object.keys(this.metrics.connectionsByChannel).forEach((channel) => {
          this.metrics.connectionsByChannel[channel]?.delete(socket.id);
        });

        logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          address: socket.data.address,
          reason,
          activeConnections: this.metrics.activeConnections,
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        logger.error('WebSocket error', {
          socketId: socket.id,
          error: error.message,
        });
      });
    });
  }

  private handleSubscribe(socket: Socket, channels: string | string[]): void {
    const channelList = Array.isArray(channels) ? channels : [channels];
    const validChannels = Object.values(WebSocketChannel);

    channelList.forEach((channel) => {
      if (!validChannels.includes(channel as WebSocketChannel)) {
        socket.emit('error', {
          message: `Invalid channel: ${channel}`,
          validChannels,
        });
        return;
      }

      socket.join(channel);

      // Track connection by channel
      if (!this.metrics.connectionsByChannel[channel]) {
        this.metrics.connectionsByChannel[channel] = new Set();
      }
      this.metrics.connectionsByChannel[channel].add(socket.id);

      logger.debug('Client subscribed to channel', {
        socketId: socket.id,
        address: socket.data.address,
        channel,
      });
    });

    socket.emit('subscribed', {
      channels: channelList,
      timestamp: Date.now(),
    });
  }

  private handleUnsubscribe(socket: Socket, channels: string | string[]): void {
    const channelList = Array.isArray(channels) ? channels : [channels];

    channelList.forEach((channel) => {
      socket.leave(channel);

      // Remove from channel tracking
      if (this.metrics.connectionsByChannel[channel]) {
        this.metrics.connectionsByChannel[channel].delete(socket.id);
      }

      logger.debug('Client unsubscribed from channel', {
        socketId: socket.id,
        address: socket.data.address,
        channel,
      });
    });

    socket.emit('unsubscribed', {
      channels: channelList,
      timestamp: Date.now(),
    });
  }

  // Emit methods for different event types
  public emitTreasuryDeposit(data: TreasuryDepositEvent): void {
    this.emitEvent(WebSocketChannel.TREASURY_DEPOSIT, data);
    this.emitTreasuryBalance({
      balance: data.totalBalance,
      changeAmount: data.amount,
      changeType: 'deposit',
      timestamp: data.timestamp,
    });
  }

  public emitTreasuryBalance(data: TreasuryBalanceEvent): void {
    this.emitEvent(WebSocketChannel.TREASURY_BALANCE, data);
  }

  public emitReimbursementNew(data: ReimbursementNewEvent): void {
    this.emitEvent(WebSocketChannel.REIMBURSEMENTS_NEW, data);
  }

  public emitReimbursementApproved(data: ReimbursementApprovedEvent): void {
    this.emitEvent(WebSocketChannel.REIMBURSEMENTS_APPROVED, data);
  }

  public emitReimbursementPaid(data: ReimbursementPaidEvent): void {
    this.emitEvent(WebSocketChannel.REIMBURSEMENTS_PAID, data);
    this.emitTreasuryBalance({
      balance: '0', // Will be updated by caller
      changeAmount: data.amount,
      changeType: 'withdrawal',
      timestamp: data.timestamp,
    });
  }

  public emitElectionVote(data: ElectionVoteEvent): void {
    this.emitEvent(WebSocketChannel.ELECTIONS_VOTE, data);
  }

  public emitElectionFinalized(data: ElectionFinalizedEvent): void {
    this.emitEvent(WebSocketChannel.ELECTIONS_FINALIZED, data);
  }

  public emitProposalNew(data: ProposalNewEvent): void {
    this.emitEvent(WebSocketChannel.PROPOSALS_NEW, data);
  }

  public emitProposalVote(data: ProposalVoteEvent): void {
    this.emitEvent(WebSocketChannel.PROPOSALS_VOTE, data);
  }

  public emitProposalFinalized(data: ProposalFinalizedEvent): void {
    this.emitEvent(WebSocketChannel.PROPOSALS_FINALIZED, data);
  }

  // Generic emit method
  private emitEvent(channel: WebSocketChannel, data: any): void {
    try {
      this.io.to(channel).emit(channel, {
        ...data,
        channel,
        emittedAt: Date.now(),
      });

      // Update metrics
      this.metrics.totalEvents++;
      this.metrics.eventsByChannel[channel] =
        (this.metrics.eventsByChannel[channel] || 0) + 1;

      logger.debug('WebSocket event emitted', {
        channel,
        subscriberCount: this.metrics.connectionsByChannel[channel]?.size || 0,
      });
    } catch (error) {
      logger.error('Failed to emit WebSocket event', {
        channel,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Get current metrics
  public getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      connectionsByChannel: Object.fromEntries(
        Object.entries(this.metrics.connectionsByChannel).map(([k, v]) => [k, v])
      ) as any,
    };
  }

  // Broadcast system message to all clients
  public broadcastSystemMessage(message: string, data?: any): void {
    this.io.emit('system:message', {
      message,
      data,
      timestamp: Date.now(),
    });
  }

  // Shutdown gracefully
  public async shutdown(): Promise<void> {
    logger.info('Shutting down WebSocket service');

    // Notify all clients
    this.broadcastSystemMessage('Server is shutting down');

    // Close all connections
    const sockets = await this.io.fetchSockets();
    sockets.forEach((socket) => {
      socket.disconnect(true);
    });

    // Close the server
    this.io.close();
    logger.info('WebSocket service shut down complete');
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export const initializeWebSocketService = (httpServer: HTTPServer): WebSocketService => {
  if (wsService) {
    logger.warn('WebSocket service already initialized');
    return wsService;
  }

  wsService = new WebSocketService(httpServer);
  return wsService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    throw new Error('WebSocket service not initialized');
  }
  return wsService;
};
