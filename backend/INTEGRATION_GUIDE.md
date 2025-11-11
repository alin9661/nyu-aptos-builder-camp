# Audit & Compliance System Integration Guide

## Quick Start (5 Minutes)

### 1. Run Database Migration

```bash
cd /Users/aaronlin/Downloads/Projects/NYUxAptos/backend
psql -U postgres -d nyu_aptos -f database/migrations/003_add_wallet_audit_logs.sql
```

**Verify migration:**
```bash
psql -U postgres -d nyu_aptos -c "\dt wallet_audit_logs"
```

### 2. Update Main Server File

Add these imports and middleware to your main server file (likely `src/index.ts` or `src/server.ts`):

```typescript
import { requestIdMiddleware, auditMiddleware } from './middleware/audit';
import complianceRoutes from './routes/compliance';
import { startDataRetentionJob } from './jobs/dataRetention';

// ... existing imports

const app = express();

// ... existing middleware

// Add audit middleware (should be early in the chain, after body parser)
app.use(requestIdMiddleware);
app.use(auditMiddleware);

// ... existing routes

// Add compliance routes
app.use('/api/compliance', complianceRoutes);

// Start data retention job
startDataRetentionJob();

// ... rest of server setup
```

### 3. Update Existing Services to Log Events

#### In WalletService (src/services/walletService.ts)

Add logging to key operations:

```typescript
import { AuditService } from './auditService';

// In createWalletForUser method, after wallet creation:
await AuditService.logWalletGeneration(
  wallet.address,
  wallet.address,
  { ssoId, ssoProvider },
  ipAddress, // pass from request
  userAgent  // pass from request
);

// In fundWallet method, after funding:
await AuditService.logWalletFunding(
  address,
  address,
  '1 APT',
  txn.hash
);

// In getAccountForSigning method, when key is decrypted:
await AuditService.logWalletAccess(
  address,
  address,
  'sign_transaction',
  ipAddress,
  requestId
);
```

#### In Authentication Routes (src/routes/auth.ts or sso.ts)

Add authentication logging:

```typescript
import { AuditService } from '../services/auditService';

// On successful login:
await AuditService.logAuthentication(
  user.address,
  user.ssoId,
  true, // success
  req.ip,
  req.get('user-agent')
);

// On failed login:
await AuditService.logAuthentication(
  null,
  ssoId,
  false, // failure
  req.ip,
  req.get('user-agent'),
  'Invalid credentials'
);
```

### 4. Test the System

```bash
# Start the server
npm run dev

# Test compliance info endpoint (public)
curl http://localhost:3000/api/compliance/info

# Test audit trail (requires auth)
curl -X GET http://localhost:3000/api/compliance/audit-trail \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Check database
psql -U postgres -d nyu_aptos -c "SELECT COUNT(*) FROM wallet_audit_logs;"
```

## Detailed Integration Steps

### Step 1: Database Setup

The migration creates 6 tables:
- `wallet_audit_logs` - Main audit log
- `user_consents` - Consent tracking
- `data_deletion_requests` - GDPR deletion requests
- `data_export_requests` - Data portability requests
- `compliance_events` - High-level compliance events
- `security_alerts` - Security monitoring

**Verify all tables:**
```bash
psql -U postgres -d nyu_aptos -c "\dt" | grep -E "wallet_audit|user_consents|data_deletion|data_export|compliance_events|security_alerts"
```

### Step 2: Environment Configuration

Add to your `.env` file:

```env
# Audit & Compliance Configuration
AUDIT_ENABLED=true
LOG_LEVEL=info
RETENTION_DAYS=730

# Monitoring
MONITORING_ENABLED=true
ALERT_WEBHOOK_URL=https://hooks.slack.com/YOUR_WEBHOOK
ADMIN_EMAIL=admin@example.com

# Cron Schedule
DATA_RETENTION_CRON=0 2 * * *
```

### Step 3: Integrate with Existing Routes

#### Update Authentication Flow

```typescript
// src/routes/auth.ts or sso.ts
import { AuditService } from '../services/auditService';

router.post('/login', async (req, res) => {
  try {
    // ... existing login logic

    // Log successful authentication
    await AuditService.logAuthentication(
      user.address,
      user.ssoId,
      true,
      req.ip,
      req.get('user-agent')
    );

    res.json({ success: true, user, token });
  } catch (error) {
    // Log failed authentication
    await AuditService.logAuthentication(
      null,
      req.body.ssoId,
      false,
      req.ip,
      req.get('user-agent'),
      error.message
    );

    res.status(401).json({ success: false, error: 'Login failed' });
  }
});
```

#### Update Wallet Operations

```typescript
// src/services/walletService.ts
import { AuditService } from './auditService';

static async createWalletForUser(
  ssoId: string,
  ssoProvider: string,
  email?: string,
  firstName?: string,
  lastName?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<any> {
  try {
    // ... existing wallet creation logic

    // Log wallet generation
    await AuditService.logWalletGeneration(
      wallet.address,
      wallet.address,
      { ssoId, ssoProvider, email },
      ipAddress,
      userAgent
    );

    return { ...result };
  } catch (error) {
    // Log failure
    await AuditService.logEvent({
      ssoId,
      eventType: 'wallet_generation_failure',
      eventCategory: 'wallet' as any,
      severity: 'error' as any,
      operation: 'create_wallet',
      status: 'failure' as any,
      errorMessage: error.message,
      ipAddress,
      userAgent,
    });

    throw error;
  }
}
```

#### Update Transaction Signing

```typescript
// Wherever you sign transactions
import { AuditService } from '../services/auditService';

// Before signing
await AuditService.logWalletAccess(
  userAddress,
  walletAddress,
  'sign_transaction',
  ipAddress,
  requestId
);

// After signing
await AuditService.logTransactionSigning(
  userAddress,
  txHash,
  txType,
  ipAddress
);
```

### Step 4: Add Sensitive Operation Logging

For operations that export or access sensitive data:

```typescript
import { sensitiveOperationAudit } from '../middleware/audit';

// On routes that export wallet keys
router.get(
  '/wallet/export',
  verifyAuth,
  sensitiveOperationAudit('wallet_export'),
  async (req, res) => {
    // ... wallet export logic
  }
);

// On routes that access private keys
router.post(
  '/wallet/sign',
  verifyAuth,
  sensitiveOperationAudit('transaction_signing'),
  async (req, res) => {
    // ... transaction signing logic
  }
);
```

### Step 5: Enable Security Monitoring

Add monitoring checks to your scheduled jobs:

```typescript
// src/index.ts or src/server.ts
import { MonitoringService } from './services/monitoringService';
import cron from 'node-cron';

// Run monitoring checks every hour
cron.schedule('0 * * * *', async () => {
  try {
    await MonitoringService.runAllChecks();
  } catch (error) {
    logger.error('Monitoring checks failed', { error });
  }
});

// Configure custom thresholds (optional)
MonitoringService.configureThresholds({
  walletAccessPerHour: 15,
  failedAuthPerHour: 10,
  dataExportsPerDay: 5,
});
```

### Step 6: Add Admin Routes (Optional)

Create admin endpoints to view alerts and reports:

```typescript
// src/routes/admin.ts
import { MonitoringService } from '../services/monitoringService';
import { ComplianceService } from '../services/complianceService';
import { requireAdmin } from '../middleware/auth';

router.get('/security/alerts', requireAdmin, async (req, res) => {
  const alerts = await MonitoringService.getActiveAlerts(50);
  res.json({ success: true, alerts });
});

router.post('/security/alerts/:alertId/resolve', requireAdmin, async (req, res) => {
  const { alertId } = req.params;
  const { notes, falsePositive } = req.body;

  await MonitoringService.resolveAlert(
    alertId,
    req.user!.address,
    notes,
    falsePositive
  );

  res.json({ success: true });
});

router.get('/compliance/report', requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;

  const report = await ComplianceService.generateComplianceReport(
    new Date(startDate as string),
    new Date(endDate as string)
  );

  res.json({ success: true, report });
});
```

## Testing Checklist

### Manual Testing

- [ ] Database migration runs successfully
- [ ] Audit logs appear in database after API calls
- [ ] Compliance endpoints return data
- [ ] Data export works for authenticated users
- [ ] Data deletion requires confirmation
- [ ] Consent management works (grant/revoke)
- [ ] Audit trail shows user activities
- [ ] Security alerts are created for suspicious activity
- [ ] Data retention job runs successfully
- [ ] Monitoring checks execute without errors

### Test Commands

```bash
# 1. Test database
psql -U postgres -d nyu_aptos -c "SELECT * FROM wallet_audit_logs LIMIT 5;"

# 2. Test compliance info (public)
curl http://localhost:3000/api/compliance/info | jq

# 3. Test with authentication
export TOKEN="your_jwt_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/compliance/audit-trail | jq

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/compliance/consent/status | jq

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/compliance/data/export | jq

# 4. Test data retention job
curl -X POST http://localhost:3000/api/admin/retention/run \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Check logs
tail -f logs/combined.log | grep -E "audit|compliance|monitoring"
```

## Common Integration Issues

### Issue 1: TypeScript Errors

If you get import errors:

```bash
npm run typecheck
```

Add missing type definitions:

```typescript
// If uuid is not found
npm install --save-dev @types/uuid
```

### Issue 2: Circular Dependencies

Avoid importing audit services in middleware that's used by audit services.

**Good:**
```typescript
// route.ts → auditService.ts ✓
import { AuditService } from '../services/auditService';
```

**Bad:**
```typescript
// auditService.ts → middleware/audit.ts → auditService.ts ✗
```

### Issue 3: Database Connection Errors

Ensure your database configuration is correct:

```typescript
// src/config/database.ts
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'nyu_aptos',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});
```

### Issue 4: Cron Job Not Running

Check the cron syntax:

```typescript
import cron from 'node-cron';

// Valid formats:
cron.schedule('0 2 * * *', handler);  // Daily at 2 AM
cron.schedule('0 * * * *', handler);  // Every hour
cron.schedule('*/5 * * * *', handler); // Every 5 minutes

// Validate before scheduling:
if (cron.validate('0 2 * * *')) {
  cron.schedule('0 2 * * *', handler);
}
```

## Performance Considerations

### 1. Async Logging

Audit logging is non-blocking:

```typescript
// Logs are written after response is sent
setImmediate(async () => {
  await AuditService.logEvent({...});
});
```

### 2. Database Indexes

All critical queries are indexed:
- User address lookups: O(log n)
- Time-based queries: O(log n)
- Event type filtering: O(log n)

### 3. Rate Limiting

Add rate limiting to compliance endpoints:

```typescript
import rateLimit from 'express-rate-limit';

const complianceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many compliance requests',
});

app.use('/api/compliance', complianceLimiter);
```

### 4. Monitoring Impact

Monitoring checks run in background:
- Scheduled hourly (adjustable)
- Non-blocking
- Failures logged but don't crash app

## Security Best Practices

### 1. Never Log Sensitive Data

```typescript
// ❌ DON'T DO THIS
await AuditService.logEvent({
  metadata: {
    privateKey: decryptedKey, // NEVER!
    password: userPassword,   // NEVER!
  }
});

// ✅ DO THIS
await AuditService.logEvent({
  metadata: {
    walletAddress: address,
    operationType: 'sign',
  }
});
```

### 2. Encrypt Audit Logs at Rest

Ensure database encryption is enabled:

```bash
# PostgreSQL encryption
ALTER SYSTEM SET ssl = on;
```

### 3. Access Control

Restrict compliance admin endpoints:

```typescript
import { requireAdmin } from '../middleware/auth';

// Only admins can view all alerts
router.get('/admin/alerts', requireAdmin, handler);

// Users can only view their own data
router.get('/compliance/audit-trail', verifyAuth, handler);
```

### 4. Rate Limiting

Prevent abuse:

```typescript
// Stricter limits for sensitive operations
const deletionLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1, // 1 deletion per day
});

router.post('/compliance/data/delete', deletionLimiter, handler);
```

## Monitoring Dashboard

Consider building a dashboard to display:

1. **Recent Activity**
   - Events per hour/day
   - Event types distribution
   - Success/failure rates

2. **Security Alerts**
   - Active alerts
   - Alert severity distribution
   - Resolution time

3. **Compliance Metrics**
   - Pending export requests
   - Pending deletion requests
   - Consent statistics

4. **Data Retention**
   - Last job run
   - Records anonymized
   - Job history

Example query for dashboard:

```sql
-- Today's audit log summary
SELECT
  event_category,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE status = 'failure') as failures
FROM wallet_audit_logs
WHERE created_at > CURRENT_DATE
GROUP BY event_category;
```

## Next Steps

1. **Run Migration**: Apply database changes
2. **Update Code**: Add audit logging to existing services
3. **Test Thoroughly**: Use the testing checklist
4. **Monitor**: Check logs and alerts
5. **Document**: Update privacy policy
6. **Train Team**: Ensure everyone understands the system

## Support

- **Documentation**: `/docs/COMPLIANCE_GDPR_CCPA.md`
- **Service README**: `/backend/src/services/README_AUDIT_COMPLIANCE.md`
- **Questions**: Contact backend team or privacy@example.com

---

**Version**: 1.0.0
**Last Updated**: 2025-11-11
**Integration Time**: ~30 minutes
