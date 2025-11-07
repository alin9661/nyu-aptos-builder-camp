import express, { Express, Request, Response, NextFunction } from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { logger, loggerStream } from './utils/logger';
import { testConnection, closePool } from './config/database';
import { getNetworkInfo } from './config/aptos';
import { initializeWebSocketService, getWebSocketService } from './services/websocket';

// Import routes
import authRoutes from './routes/auth';
import treasuryRoutes from './routes/treasury';
import governanceRoutes from './routes/governance';
import proposalsRoutes from './routes/proposals';

// Load environment variables
dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server for Socket.IO
const httpServer = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware with error tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      query: Object.keys(req.query).length > 0 ? req.query : undefined,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
    };

    // Log errors (4xx/5xx) as warnings or errors
    if (res.statusCode >= 500) {
      logger.error('HTTP Request - Server Error', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request - Client Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });
  next();
});

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    const networkInfo = getNetworkInfo();

    // Get WebSocket metrics if initialized
    let wsMetrics = null;
    try {
      const wsService = getWebSocketService();
      wsMetrics = wsService.getMetrics();
    } catch {
      // WebSocket service not yet initialized
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      database: dbHealthy ? 'connected' : 'disconnected',
      network: networkInfo,
      websocket: wsMetrics ? {
        connected: true,
        activeConnections: wsMetrics.activeConnections,
        totalConnections: wsMetrics.totalConnections,
        totalEvents: wsMetrics.totalEvents,
      } : {
        connected: false,
      },
      version: process.env.npm_package_version || '1.0.0',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// WebSocket metrics endpoint
app.get('/api/websocket/metrics', (req: Request, res: Response) => {
  try {
    const wsService = getWebSocketService();
    const metrics = wsService.getMetrics();

    res.json({
      success: true,
      metrics: {
        activeConnections: metrics.activeConnections,
        totalConnections: metrics.totalConnections,
        totalEvents: metrics.totalEvents,
        eventsByChannel: metrics.eventsByChannel,
        channelSubscribers: Object.fromEntries(
          Object.entries(metrics.connectionsByChannel).map(([k, v]) => [
            k,
            v.size,
          ])
        ),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'WebSocket not initialized',
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/treasury', treasuryRoutes);
app.use('/api/governance', governanceRoutes);
app.use('/api/proposals', proposalsRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'NYU Aptos Builder Camp Backend',
    version: '1.0.0',
    description: 'Backend API for governance and treasury management platform',
    endpoints: {
      health: '/health',
      websocketMetrics: '/api/websocket/metrics',
      auth: {
        nonce: 'POST /api/auth/nonce',
        login: 'POST /api/auth/login',
        refresh: 'POST /api/auth/refresh',
        verify: 'POST /api/auth/verify',
        me: 'GET /api/auth/me',
        profile: 'PUT /api/auth/profile',
        logout: 'POST /api/auth/logout',
      },
      treasury: {
        balance: 'GET /api/treasury/balance',
        transactions: 'GET /api/treasury/transactions',
        stats: 'GET /api/treasury/stats',
        reimbursements: 'GET /api/treasury/reimbursements',
        reimbursementDetails: 'GET /api/treasury/reimbursements/:id',
        submitReimbursement: 'POST /api/treasury/reimbursements/submit',
        approveReimbursement: 'POST /api/treasury/reimbursements/:id/approve',
        uploadInvoice: 'POST /api/treasury/invoices/upload',
        getInvoiceMetadata: 'GET /api/treasury/invoices/:requestId',
        downloadInvoice: 'GET /api/treasury/invoices/:requestId/download',
      },
      governance: {
        elections: 'GET /api/governance/elections',
        electionDetails: 'GET /api/governance/elections/:electionId/:role',
        vote: 'POST /api/governance/vote',
        roles: 'GET /api/governance/roles',
        members: 'GET /api/governance/members',
        stats: 'GET /api/governance/stats',
      },
      proposals: {
        list: 'GET /api/proposals',
        details: 'GET /api/proposals/:id',
        create: 'POST /api/proposals/create',
        vote: 'POST /api/proposals/:id/vote',
        active: 'GET /api/proposals/status/active',
        stats: 'GET /api/proposals/stats/overview',
      },
    },
    websocket: {
      url: `ws://localhost:${PORT}`,
      channels: [
        'treasury:deposit',
        'treasury:balance',
        'reimbursements:new',
        'reimbursements:approved',
        'reimbursements:paid',
        'elections:vote',
        'elections:finalized',
        'proposals:new',
        'proposals:vote',
        'proposals:finalized',
      ],
    },
  });
});

// Static file handlers (prevent 404 spam from browser requests)
app.get('/favicon.ico', (req: Request, res: Response) => {
  res.status(204).end(); // No content
});

// Filter Next.js development routes silently
app.use((req: Request, res: Response, next: NextFunction) => {
  // Ignore Next.js HMR and internal routes
  if (
    req.path.startsWith('/_next/') ||
    req.path.startsWith('/__nextjs') ||
    req.path === '/_error'
  ) {
    return res.status(404).end();
  }
  next();
});

// Enhanced 404 handler with detailed logging
app.use((req: Request, res: Response) => {
  // Log 404s with full context for debugging
  logger.warn('404 Not Found - Endpoint does not exist', {
    method: req.method,
    path: req.path,
    fullUrl: req.originalUrl,
    query: req.query,
    body: req.method === 'POST' ? req.body : undefined,
    headers: {
      referer: req.headers.referer,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
    },
    timestamp: new Date().toISOString(),
  });

  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
    message: `The requested endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: {
      auth: '/api/auth/*',
      treasury: '/api/treasury/*',
      governance: '/api/governance/*',
      proposals: '/api/proposals/*',
      health: '/health',
      docs: '/ (API documentation)',
    },
  });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Initialize WebSocket service
    const wsService = initializeWebSocketService(httpServer);
    logger.info('WebSocket service initialized');

    // Start HTTP server with Socket.IO
    httpServer.listen(PORT, () => {
      logger.info(`Server started`, {
        port: PORT,
        environment: NODE_ENV,
        network: getNetworkInfo().network,
        websocket: 'enabled',
      });
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down server...');

      // Shutdown WebSocket service first
      await wsService.shutdown();

      // Close HTTP server
      httpServer.close(async () => {
        await closePool();
        logger.info('Server shut down complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
export { httpServer };
