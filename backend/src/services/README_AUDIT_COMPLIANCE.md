# Audit Logging & Compliance System

## Overview

This directory contains the enterprise-grade audit logging and compliance system for the NYU x Aptos platform. The system ensures GDPR, CCPA, and blockchain compliance through comprehensive logging, user rights management, and automated data retention.

## Architecture

### Core Services

1. **AuditService** (`auditService.ts`)
   - Comprehensive event logging
   - Audit trail generation
   - Suspicious activity detection
   - Statistics and reporting

2. **ComplianceService** (`complianceService.ts`)
   - GDPR rights implementation
   - CCPA rights implementation
   - Consent management
   - Data export/deletion
   - Retention policy enforcement

3. **MonitoringService** (`monitoringService.ts`)
   - Real-time security monitoring
   - Alert generation and management
   - Pattern detection
   - Notification system

### Supporting Components

4. **Audit Middleware** (`../middleware/audit.ts`)
   - Automatic request logging
   - IP and user agent tracking
   - Request ID correlation
   - Performance monitoring

5. **Data Retention Job** (`../jobs/dataRetention.ts`)
   - Scheduled data anonymization
   - Consent revocation processing
   - Export cleanup
   - Report generation

6. **Compliance Routes** (`../routes/compliance.ts`)
   - User-facing API endpoints
   - GDPR/CCPA request handling
   - Consent management UI

## Quick Start

### 1. Database Setup

Run the migration:

```bash
psql -U postgres -d nyu_aptos -f backend/database/migrations/003_add_wallet_audit_logs.sql
```

### 2. Initialize Services

```typescript
import { AuditService } from './services/auditService';
import { MonitoringService } from './services/monitoringService';
import { startDataRetentionJob } from './jobs/dataRetention';

// Start data retention cron job
startDataRetentionJob();

// Optional: Configure monitoring thresholds
MonitoringService.configureThresholds({
  walletAccessPerHour: 15,
  failedAuthPerHour: 10,
});
```

### 3. Add Middleware to Express App

```typescript
import express from 'express';
import { requestIdMiddleware, auditMiddleware } from './middleware/audit';
import complianceRoutes from './routes/compliance';

const app = express();

// Add request ID and audit middleware
app.use(requestIdMiddleware);
app.use(auditMiddleware);

// Add compliance routes
app.use('/api/compliance', complianceRoutes);
```

## Usage Examples

### Logging Events

```typescript
import { AuditService, EventCategory, EventSeverity, EventStatus } from './services/auditService';

// Log wallet generation
await AuditService.logWalletGeneration(
  userAddress,
  walletAddress,
  { ssoId: 'abc123' },
  ipAddress,
  userAgent
);

// Log authentication
await AuditService.logAuthentication(
  userAddress,
  ssoId,
  true, // success
  ipAddress,
  userAgent
);

// Log custom event
await AuditService.logEvent({
  userAddress: '0x123...',
  eventType: 'custom_event',
  eventCategory: EventCategory.WALLET,
  severity: EventSeverity.INFO,
  operation: 'my_operation',
  status: EventStatus.SUCCESS,
  metadata: { key: 'value' },
});
```

### Getting Audit Trail

```typescript
// Get user's audit trail
const auditTrail = await AuditService.getAuditTrail({
  userAddress: '0x123...',
  startDate: new Date('2025-01-01'),
  limit: 100,
});

// Get audit statistics
const stats = await AuditService.getUserAuditStats(userAddress, 30);
console.log(stats);
// {
//   totalEvents: 150,
//   eventsByCategory: { wallet: 50, authentication: 100 },
//   eventsBySeverity: { info: 140, warning: 10 },
//   failureRate: 0.067,
//   lastActivity: Date
// }
```

### GDPR/CCPA Operations

```typescript
import { ComplianceService, ConsentType } from './services/complianceService';

// Export user data (GDPR Article 20)
const exportData = await ComplianceService.exportUserData(
  userAddress,
  'json',
  ipAddress
);

// Delete user data (GDPR Article 17)
const deletionReport = await ComplianceService.deleteUserData(
  userAddress,
  'gdpr',
  false, // deleteBlockchainData
  ipAddress
);

// Update user data (GDPR Article 16)
await ComplianceService.updateUserData(
  userAddress,
  { email: 'new@nyu.edu' },
  ipAddress
);

// Manage consent
await ComplianceService.recordConsent(
  userAddress,
  ConsentType.ANALYTICS,
  '1.0',
  ipAddress,
  userAgent
);

await ComplianceService.revokeConsent(
  userAddress,
  ConsentType.ANALYTICS,
  ipAddress
);
```

### Security Monitoring

```typescript
import { MonitoringService } from './services/monitoringService';

// Run all monitoring checks
await MonitoringService.runAllChecks();

// Monitor specific user
await MonitoringService.monitorWalletAccess(userAddress);
await MonitoringService.monitorGeographicAnomaly(userAddress, currentIp);

// Get active alerts
const alerts = await MonitoringService.getActiveAlerts(50);

// Resolve alert
await MonitoringService.resolveAlert(
  alertId,
  'admin@example.com',
  'False positive - user traveling',
  true // falsePositive
);

// Get alert statistics
const alertStats = await MonitoringService.getAlertStats(30);
```

### Data Retention

```typescript
import {
  runDataRetentionJobNow,
  getDataRetentionJobStatus
} from './jobs/dataRetention';

// Run job manually
const stats = await runDataRetentionJobNow();
console.log(`Anonymized ${stats.recordsAnonymized} records`);

// Check job status
const status = getDataRetentionJobStatus();
console.log(status);
// {
//   enabled: true,
//   isRunning: false,
//   lastRun: Date,
//   config: {...}
// }
```

## API Endpoints

### Compliance Endpoints

All endpoints require authentication unless noted.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/compliance/info` | Get compliance information (public) |
| POST | `/api/compliance/consent` | Grant consent |
| DELETE | `/api/compliance/consent/:type` | Revoke consent |
| GET | `/api/compliance/consent/status` | Get consent status |
| GET | `/api/compliance/data/export` | Export user data (GDPR Article 20) |
| GET | `/api/compliance/data/export/json` | Export as JSON download |
| POST | `/api/compliance/data/delete` | Delete user data (GDPR Article 17) |
| PUT | `/api/compliance/data/rectify` | Update user data (GDPR Article 16) |
| GET | `/api/compliance/audit-trail` | Get user's audit trail |
| GET | `/api/compliance/consent-types` | List available consent types |

### Example API Calls

**Export User Data:**
```bash
curl -X GET "https://api.example.com/api/compliance/data/export" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Delete User Data:**
```bash
curl -X POST "https://api.example.com/api/compliance/data/delete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "DELETE_MY_DATA",
    "requestType": "gdpr"
  }'
```

**Get Audit Trail:**
```bash
curl -X GET "https://api.example.com/api/compliance/audit-trail?limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Database Schema

### Tables Created

1. **wallet_audit_logs**: Comprehensive event logging
2. **user_consents**: Consent tracking with versions
3. **data_deletion_requests**: GDPR/CCPA deletion tracking
4. **data_export_requests**: Data portability requests
5. **compliance_events**: High-level compliance milestones
6. **security_alerts**: Automated security monitoring

See `backend/database/migrations/003_add_wallet_audit_logs.sql` for details.

## Configuration

### Environment Variables

```env
# Audit Configuration
LOG_LEVEL=info
AUDIT_ENABLED=true
RETENTION_DAYS=730

# Monitoring Configuration
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
ADMIN_EMAIL=admin@example.com

# Cron Schedule
DATA_RETENTION_CRON=0 2 * * *  # 2 AM daily
```

### Monitoring Thresholds

Default thresholds (configurable):

```typescript
{
  walletAccessPerHour: 10,
  failedWalletGenPerHour: 5,
  failedAuthPerHour: 5,
  dataExportsPerDay: 3,
  consentRevocationsPerDay: 5,
  suspiciousIpChanges: 3
}
```

## Security Considerations

### Private Key Handling

- **NEVER** log private keys (even encrypted ones)
- Only log wallet addresses (public)
- Access to private keys is logged for audit

### IP Address Logging

- IP addresses are logged for security
- Anonymized after 2 years
- Used for geographic anomaly detection

### Data Anonymization

After retention period:
- User addresses → "ANONYMIZED"
- SSO IDs → NULL
- IP addresses → NULL
- User agents → NULL
- Metadata preserved for analytics

### Rate Limiting

Compliance endpoints should have rate limits:

```typescript
import rateLimit from 'express-rate-limit';

const complianceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many compliance requests',
});

app.use('/api/compliance', complianceLimiter);
```

## Compliance Features

### GDPR Compliance

✅ **Article 7**: Consent Management
✅ **Article 15**: Right of Access
✅ **Article 16**: Right to Rectification
✅ **Article 17**: Right to Erasure
✅ **Article 20**: Right to Data Portability
✅ **Article 30**: Records of Processing Activities
✅ **Article 32**: Security of Processing

### CCPA Compliance

✅ **Right to Know**: Data export functionality
✅ **Right to Delete**: Data deletion functionality
✅ **Right to Opt-Out**: Consent management

### Blockchain Considerations

⚠️ **Important**: Blockchain data (wallet addresses, transactions) cannot be deleted due to immutability. This is:
- A technical limitation
- Covered under GDPR Article 17(3) exceptions
- Clearly communicated to users
- Documented in privacy policy

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### Test Coverage

```bash
npm run test:coverage
```

### Manual Testing

```bash
# Test audit logging
curl -X POST http://localhost:3000/api/test/audit

# Test compliance export
curl -X GET http://localhost:3000/api/compliance/data/export \
  -H "Authorization: Bearer TEST_TOKEN"

# Test monitoring
curl -X GET http://localhost:3000/api/admin/security/alerts \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Monitoring & Alerts

### Dashboard Metrics

Monitor these metrics:

1. **Audit Logs**
   - Events per hour/day
   - Error rate
   - Response times

2. **Security Alerts**
   - Active alerts count
   - Alert severity distribution
   - False positive rate

3. **Compliance**
   - Data export requests (pending/completed)
   - Deletion requests (pending/completed)
   - Consent revocations

4. **Data Retention**
   - Last job run time
   - Records anonymized
   - Job success/failure rate

### Alert Channels

Configure notification channels:

```typescript
MonitoringService.addNotificationChannel({
  type: 'slack',
  config: {
    webhookUrl: 'https://hooks.slack.com/...',
    channel: '#security-alerts',
  },
  enabled: true,
});

MonitoringService.addNotificationChannel({
  type: 'email',
  config: {
    recipients: ['security@example.com'],
    smtpConfig: {...},
  },
  enabled: true,
});
```

## Performance Optimization

### Database Indexes

All critical queries are indexed:
- User address lookups
- Time-based queries
- Event type filtering
- Status filtering

### Async Logging

Audit logging is asynchronous and non-blocking:

```typescript
// Logs are written after response is sent
setImmediate(async () => {
  await AuditService.logEvent({...});
});
```

### Batch Operations

For bulk operations, use batch inserts:

```typescript
// Instead of multiple individual logs
for (const user of users) {
  // Use batch insert for better performance
}
```

## Troubleshooting

### Common Issues

**Issue**: Audit logs not appearing
- Check LOG_LEVEL environment variable
- Verify database connection
- Check middleware order

**Issue**: Data retention job not running
- Verify cron schedule syntax
- Check job enabled flag
- Review system logs

**Issue**: Alerts not sending
- Verify notification channels configured
- Check webhook URLs
- Review alert thresholds

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

## Best Practices

1. **Regular Reviews**
   - Review audit logs weekly
   - Check security alerts daily
   - Run compliance reports monthly

2. **Data Minimization**
   - Only log necessary information
   - Use anonymization where possible
   - Implement strict retention policies

3. **User Transparency**
   - Clear privacy policies
   - Easy access to audit trails
   - Prompt response to requests

4. **Security First**
   - Never log sensitive data
   - Encrypt at rest and in transit
   - Regular security audits

5. **Documentation**
   - Keep compliance docs updated
   - Document all design decisions
   - Maintain incident response plans

## Support

For questions or issues:
- Email: privacy@example.com
- Documentation: `/docs/COMPLIANCE_GDPR_CCPA.md`
- Internal Wiki: [Link to wiki]

## License

MIT License - See LICENSE file for details

---

**Last Updated**: 2025-11-11
**Maintained By**: Backend Team
**Version**: 1.0.0
