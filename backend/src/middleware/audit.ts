import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { AuditService, EventCategory, EventSeverity, EventStatus } from '../services/auditService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended request with audit metadata
 */
export interface AuditRequest extends AuthenticatedRequest {
  requestId?: string;
  startTime?: number;
}

/**
 * Extract IP address from request
 * Handles proxied requests and multiple IP headers
 */
const getClientIp = (req: Request): string | undefined => {
  // Check X-Forwarded-For header (proxied requests)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return ips.split(',')[0].trim();
  }

  // Check X-Real-IP header
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress;
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req: Request): string | undefined => {
  const userAgent = req.headers['user-agent'];
  return Array.isArray(userAgent) ? userAgent[0] : userAgent;
};

/**
 * Middleware to add request ID for correlation
 * Should be used early in the middleware chain
 */
export const requestIdMiddleware = (
  req: AuditRequest,
  _res: Response,
  next: NextFunction
): void => {
  // Generate or use existing request ID
  req.requestId = (req.headers['x-request-id'] as string) || uuidv4();
  req.startTime = Date.now();
  next();
};

/**
 * Audit middleware for automatic logging of API calls
 * Logs all requests that pass through it
 */
export const auditMiddleware = (
  req: AuditRequest,
  res: Response,
  next: NextFunction
): void => {
  const startTime = req.startTime || Date.now();
  const requestId = req.requestId || uuidv4();
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Log request start
  logger.debug('API request started', {
    requestId,
    method: req.method,
    path: req.path,
    userAddress: req.user?.address,
    ipAddress,
  });

  // Store original end function
  const originalEnd = res.end;

  // Override end function to log after response
  res.end = function (chunk?: any, encoding?: any, callback?: any): any {
    // Restore original end
    res.end = originalEnd;

    // Call original end
    const result = res.end(chunk, encoding, callback);

    // Log after response is sent
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Determine event details based on request
    const eventType = determineEventType(req);
    const eventCategory = determineEventCategory(req);
    const severity = determineSeverity(statusCode);
    const status = determineStatus(statusCode);
    const operation = `${req.method} ${req.path}`;

    // Log the audit event asynchronously (don't block response)
    setImmediate(async () => {
      try {
        await AuditService.logEvent({
          userAddress: req.user?.address,
          ssoId: req.user ? undefined : extractSsoFromRequest(req),
          eventType,
          eventCategory,
          severity,
          operation,
          status,
          ipAddress,
          userAgent,
          requestId,
          metadata: {
            method: req.method,
            path: req.path,
            statusCode,
            duration,
            query: req.query,
            params: req.params,
          },
          errorMessage: statusCode >= 400 ? `HTTP ${statusCode}` : undefined,
          createdBy: 'audit_middleware',
        });
      } catch (error) {
        logger.error('Failed to log audit event in middleware', {
          error,
          requestId,
          path: req.path,
        });
      }
    });

    return result;
  };

  next();
};

/**
 * Determine event type based on request path
 */
function determineEventType(req: Request): string {
  const path = req.path.toLowerCase();

  if (path.includes('/auth') || path.includes('/login')) {
    return req.method === 'POST' ? 'authentication_attempt' : 'authentication_check';
  }
  if (path.includes('/wallet')) {
    if (path.includes('/generate')) return 'wallet_generation_attempt';
    if (path.includes('/fund')) return 'wallet_funding_attempt';
    if (path.includes('/export')) return 'wallet_export_attempt';
    return 'wallet_operation';
  }
  if (path.includes('/compliance')) {
    if (path.includes('/consent')) return 'consent_operation';
    if (path.includes('/export')) return 'data_export_request';
    if (path.includes('/delete')) return 'data_deletion_request';
    return 'compliance_operation';
  }
  if (path.includes('/governance') || path.includes('/proposal') || path.includes('/vote')) {
    return 'governance_operation';
  }
  if (path.includes('/transaction')) {
    return 'transaction_operation';
  }

  return 'api_access';
}

/**
 * Determine event category based on request path
 */
function determineEventCategory(req: Request): EventCategory {
  const path = req.path.toLowerCase();

  if (path.includes('/auth') || path.includes('/login')) {
    return EventCategory.AUTHENTICATION;
  }
  if (path.includes('/wallet')) {
    return EventCategory.WALLET;
  }
  if (path.includes('/compliance') || path.includes('/consent') || path.includes('/gdpr')) {
    return EventCategory.COMPLIANCE;
  }
  if (path.includes('/transaction')) {
    return EventCategory.TRANSACTION;
  }

  return EventCategory.SECURITY;
}

/**
 * Determine severity based on HTTP status code
 */
function determineSeverity(statusCode: number): EventSeverity {
  if (statusCode >= 500) return EventSeverity.CRITICAL;
  if (statusCode >= 400) return EventSeverity.WARNING;
  if (statusCode >= 300) return EventSeverity.INFO;
  return EventSeverity.INFO;
}

/**
 * Determine status based on HTTP status code
 */
function determineStatus(statusCode: number): EventStatus {
  if (statusCode >= 200 && statusCode < 300) return EventStatus.SUCCESS;
  if (statusCode >= 300 && statusCode < 400) return EventStatus.SUCCESS;
  return EventStatus.FAILURE;
}

/**
 * Extract SSO ID from request if available
 */
function extractSsoFromRequest(req: Request): string | undefined {
  // Try to extract from body
  if (req.body && req.body.ssoId) {
    return req.body.ssoId;
  }
  // Try to extract from query
  if (req.query && req.query.ssoId) {
    return req.query.ssoId as string;
  }
  return undefined;
}

/**
 * Audit middleware specifically for wallet operations
 * Provides enhanced logging for sensitive wallet operations
 */
export const walletAuditMiddleware = async (
  req: AuditRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestId = req.requestId || uuidv4();
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  // Check for suspicious patterns
  if (req.user?.address) {
    try {
      // Check access frequency
      const stats = await AuditService.getUserAuditStats(req.user.address, 1); // Last 24 hours
      const walletEvents = stats.eventsByCategory['wallet'] || 0;

      // Flag if too many wallet operations
      if (walletEvents > 50) {
        logger.warn('High wallet operation frequency detected', {
          userAddress: req.user.address,
          eventCount: walletEvents,
          ipAddress,
          requestId,
        });

        await AuditService.flagSuspiciousActivity({
          userAddress: req.user.address,
          eventType: 'high_wallet_operation_frequency',
          eventCategory: EventCategory.SECURITY,
          severity: EventSeverity.WARNING,
          operation: 'wallet_access_pattern_analysis',
          status: EventStatus.SUCCESS,
          ipAddress,
          requestId,
          metadata: {
            walletEventCount: walletEvents,
            timeWindow: '24 hours',
          },
        });
      }
    } catch (error) {
      logger.error('Failed to check wallet access patterns', {
        error,
        userAddress: req.user.address,
      });
    }
  }

  next();
};

/**
 * Audit middleware specifically for compliance operations
 * Ensures all GDPR/CCPA operations are properly logged
 */
export const complianceAuditMiddleware = async (
  req: AuditRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestId = req.requestId || uuidv4();
  const ipAddress = getClientIp(req);
  const userAgent = getUserAgent(req);

  logger.info('Compliance operation initiated', {
    requestId,
    method: req.method,
    path: req.path,
    userAddress: req.user?.address,
    ipAddress,
  });

  // Store compliance context for detailed logging after response
  (req as any).complianceContext = {
    requestId,
    ipAddress,
    userAgent,
    startTime: Date.now(),
  };

  next();
};

/**
 * Rate limiting audit middleware
 * Tracks and logs rate limit violations
 */
export const rateLimitAuditMiddleware = (limitType: string) => {
  return async (req: AuditRequest, _res: Response, next: NextFunction): Promise<void> => {
    const ipAddress = getClientIp(req);
    const requestId = req.requestId || uuidv4();

    logger.warn('Rate limit exceeded', {
      requestId,
      limitType,
      ipAddress,
      userAddress: req.user?.address,
      path: req.path,
    });

    // Log rate limit violation
    try {
      await AuditService.logEvent({
        userAddress: req.user?.address,
        eventType: 'rate_limit_exceeded',
        eventCategory: EventCategory.SECURITY,
        severity: EventSeverity.WARNING,
        operation: `rate_limit_${limitType}`,
        status: EventStatus.FAILURE,
        ipAddress,
        requestId,
        metadata: {
          limitType,
          path: req.path,
          method: req.method,
        },
        createdBy: 'rate_limit_middleware',
      });
    } catch (error) {
      logger.error('Failed to log rate limit violation', { error });
    }

    next();
  };
};

/**
 * Error audit middleware
 * Logs application errors
 */
export const errorAuditMiddleware = async (
  error: Error,
  req: AuditRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const requestId = req.requestId || uuidv4();
  const ipAddress = getClientIp(req);

  logger.error('Application error', {
    error: error.message,
    stack: error.stack,
    requestId,
    path: req.path,
    userAddress: req.user?.address,
  });

  // Log error event
  try {
    await AuditService.logEvent({
      userAddress: req.user?.address,
      eventType: 'application_error',
      eventCategory: EventCategory.SECURITY,
      severity: EventSeverity.ERROR,
      operation: `${req.method} ${req.path}`,
      status: EventStatus.FAILURE,
      ipAddress,
      requestId,
      errorMessage: error.message,
      metadata: {
        stack: error.stack,
        method: req.method,
        path: req.path,
      },
      createdBy: 'error_middleware',
    });
  } catch (auditError) {
    logger.error('Failed to log error event', { error: auditError });
  }

  next(error);
};

/**
 * Sensitive operation audit middleware
 * For operations that require extra scrutiny (key export, deletion, etc.)
 */
export const sensitiveOperationAudit = (operationType: string) => {
  return async (req: AuditRequest, _res: Response, next: NextFunction): Promise<void> => {
    const requestId = req.requestId || uuidv4();
    const ipAddress = getClientIp(req);
    const userAgent = getUserAgent(req);

    logger.warn('Sensitive operation initiated', {
      operationType,
      requestId,
      userAddress: req.user?.address,
      ipAddress,
      path: req.path,
    });

    // Log sensitive operation
    try {
      await AuditService.logEvent({
        userAddress: req.user?.address,
        eventType: `sensitive_operation_${operationType}`,
        eventCategory: EventCategory.SECURITY,
        severity: EventSeverity.WARNING,
        operation: operationType,
        status: EventStatus.PENDING,
        ipAddress,
        userAgent,
        requestId,
        metadata: {
          path: req.path,
          method: req.method,
        },
        createdBy: 'sensitive_operation_middleware',
      });
    } catch (error) {
      logger.error('Failed to log sensitive operation', { error });
    }

    next();
  };
};
