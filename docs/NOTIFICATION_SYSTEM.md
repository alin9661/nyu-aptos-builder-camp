# NYU Nexus Notification System

Comprehensive user notification and education system for Aptos wallet assignments.

## Overview

The notification system provides multi-channel communication to inform users about their auto-generated Aptos wallets and educate them about blockchain basics, security, and platform features.

## Architecture

### Backend Components

#### 1. Notification Service (`/backend/src/services/notificationService.ts`)

Core service managing all notification operations:

**Features**:
- Email notification sending
- In-app notification management
- User preference handling
- Rate limiting (max 1 email per 5 minutes per user)
- Queue management for async processing

**Key Methods**:
- `sendWalletCreatedEmail()` - Send welcome email with wallet info
- `sendWalletEducationEmail()` - Send security guide email
- `sendWalletFundedEmail()` - Notify user of wallet funding
- `createInAppNotification()` - Create in-app notification
- `markAsRead()` / `markAllAsRead()` - Update read status
- `getUserNotifications()` - Retrieve user notifications with pagination
- `queueNotification()` - Add to processing queue
- `processNotificationQueue()` - Process queued notifications

#### 2. Email Service (`/backend/src/services/emailService.ts`)

Multi-provider email delivery service:

**Supported Providers**:
- SendGrid (recommended for production)
- Mailgun
- AWS SES
- SMTP (development/fallback)

**Features**:
- Template-based emails (HTML + plain text)
- Placeholder replacement
- CAN-SPAM compliance (unsubscribe links)
- Multiple provider fallback
- Development mode (logs instead of sending)

**Configuration** (`.env`):
```
EMAIL_PROVIDER=sendgrid|mailgun|ses|smtp
EMAIL_API_KEY=your_api_key
EMAIL_DOMAIN=nexus.nyu.edu
EMAIL_FROM=noreply@nexus.nyu.edu
EMAIL_FROM_NAME=NYU Nexus
EMAIL_REPLY_TO=support@nexus.nyu.edu
```

#### 3. Notification Worker (`/backend/src/workers/notificationWorker.ts`)

Background worker for async notification processing:

**Features**:
- Cron-based queue processing (every 30 seconds)
- Retry logic (max 3 attempts)
- Rate limiting (max 100 emails per minute)
- Graceful shutdown handling
- Statistics tracking

**Usage**:
```typescript
import { notificationWorker } from './workers/notificationWorker';

// Start worker
notificationWorker.start();

// Stop worker
notificationWorker.stop();

// Manually trigger processing
await notificationWorker.triggerProcessing();

// Get statistics
const stats = notificationWorker.getStats();
```

#### 4. API Routes (`/backend/src/routes/notifications.ts`)

RESTful API endpoints for notification management:

**Endpoints**:
```
GET    /api/notifications                 - Get user notifications (paginated)
GET    /api/notifications/unread-count    - Get unread count
PUT    /api/notifications/:id/read        - Mark as read
PUT    /api/notifications/read-all        - Mark all as read
DELETE /api/notifications/:id             - Delete notification
GET    /api/notifications/preferences     - Get preferences
PUT    /api/notifications/preferences     - Update preferences
POST   /api/notifications/test            - Send test notification (dev only)
GET    /api/notifications/categories      - Get available categories
```

**Authentication**:
Currently uses `x-user-address` header. TODO: Implement JWT authentication.

### Database Schema

#### Tables

**user_notifications** - In-app notifications
```sql
CREATE TABLE user_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(66) NOT NULL,
  notification_type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'normal',
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

**notification_queue** - Async email processing queue
```sql
CREATE TABLE notification_queue (
  id BIGSERIAL PRIMARY KEY,
  notification_data JSONB NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP
);
```

**users** - Additional columns
```sql
ALTER TABLE users ADD COLUMN notification_preferences JSONB;
ALTER TABLE users ADD COLUMN last_email_sent_at TIMESTAMP;
```

#### Notification Types

- `wallet_created` - Your Aptos wallet was created
- `wallet_funded` - Your wallet was funded with APT
- `security_reminder` - Security best practices
- `education` - Educational content about Aptos
- `governance` - Governance proposals and votes
- `reimbursement` - Reimbursement requests and approvals
- `treasury` - Treasury updates

#### Categories

- `wallet` - Wallet-related notifications
- `security` - Security alerts and tips
- `governance` - Governance proposals and votes
- `reimbursement` - Reimbursements
- `treasury` - Treasury and finances
- `education` - Educational content
- `system` - System announcements

### Frontend Components

#### 1. WalletWelcomeModal (`/frontend/components/notifications/WalletWelcomeModal.tsx`)

Modal shown after SSO login when wallet is created:

**Features**:
- Congratulations message
- Wallet address display with copy button
- Educational tabs (Overview, Security, Features)
- Links to block explorer
- Security information
- Getting started guide

**Usage**:
```tsx
import { WalletWelcomeModal } from '@/components/notifications/WalletWelcomeModal';

<WalletWelcomeModal
  open={showModal}
  onClose={() => setShowModal(false)}
  walletAddress={walletAddress}
  network="testnet"
/>
```

#### 2. WalletEducationPanel (`/frontend/components/notifications/WalletEducationPanel.tsx`)

Comprehensive education panel with tabs:

**Tabs**:
- **Overview**: What is Aptos, APT token, Octas, transactions, gas fees
- **Your Wallet**: Address, balance, public vs private keys
- **Security**: Encryption, best practices, what you can/cannot do
- **Resources**: Official docs, tutorials, support links
- **FAQs**: Common questions with accordion interface

**Usage**:
```tsx
import { WalletEducationPanel } from '@/components/notifications/WalletEducationPanel';

<WalletEducationPanel
  walletAddress={walletAddress}
  balance="1.5"
  network="testnet"
/>
```

#### 3. NotificationCenter (`/frontend/components/NotificationCenter.tsx`)

Bell icon notification center (already exists):

**Features**:
- Unread count badge
- Dropdown with recent notifications
- Mark as read functionality
- Category-based icons
- Timestamp formatting
- Integration with context provider

**Usage**:
```tsx
import { NotificationCenter, NotificationCenterProvider } from '@/components/NotificationCenter';

// Wrap app with provider
<NotificationCenterProvider>
  <App />
</NotificationCenterProvider>

// Use notification center
<NotificationCenter />
```

### Email Templates

#### Templates Location
`/backend/src/templates/emails/`

#### Available Templates

**wallet-created.html / .txt**
- Welcome message
- Wallet address prominently displayed
- Security notice
- What is Aptos blockchain
- Next steps
- Professional NYU branding
- Unsubscribe link

**wallet-security-guide.html / .txt**
- What is a cryptocurrency wallet
- Public vs private keys explanation
- How we secure your wallet (AES-256-GCM)
- What you can and cannot do
- Recovery options
- Best practices
- Common scams to avoid
- FAQs
- Links to resources

**Inline wallet-funded email**
- Transaction confirmation
- Amount and recipient
- Link to block explorer
- Next steps

#### Template Variables

Templates use `{{variable}}` syntax for placeholders:

- `{{displayName}}` - User's display name
- `{{walletAddress}}` - Full wallet address
- `{{network}}` - testnet or mainnet
- `{{explorerUrl}}` - Link to block explorer
- `{{supportUrl}}` - Support center URL
- `{{docsUrl}}` - Documentation URL
- `{{unsubscribeUrl}}` - Unsubscribe link
- `{{currentYear}}` - Current year for copyright

### Educational Documentation

#### Documentation Location
`/docs/user-education/`

#### Available Guides

**aptos-basics.md**
- What is Aptos
- APT token explained
- What are Octas
- How transactions work
- Gas fees explained
- Block explorers
- Common terms
- Learning resources

**wallet-security.md**
- Public vs private keys
- How we secure your wallet
- Recovery options
- Best practices
- Common scams to avoid
- Security checklist
- Reporting security issues

**getting-started.md**
- Your first steps
- How to view your wallet
- How to submit reimbursements
- How to participate in governance
- Understanding notifications
- Common tasks
- Getting help
- Troubleshooting

**faqs.md**
- 25+ common questions and answers
- Organized by category
- Wallet basics
- Getting APT tokens
- Transaction questions
- Using the platform
- Technical questions
- Security & privacy
- Account management
- Troubleshooting
- Getting more help

## Integration Guide

### 1. Database Migration

Run the migration to create notification tables:

```bash
psql -U your_user -d your_database -f backend/database/migrations/003_add_notifications.sql
```

### 2. Environment Variables

Add to `.env`:

```env
# Email Configuration
EMAIL_PROVIDER=smtp
EMAIL_API_KEY=
EMAIL_DOMAIN=nexus.nyu.edu
EMAIL_FROM=noreply@nexus.nyu.edu
EMAIL_FROM_NAME=NYU Nexus
EMAIL_REPLY_TO=support@nexus.nyu.edu

# URLs
APP_URL=https://nexus.nyu.edu
SUPPORT_URL=https://nexus.nyu.edu/support
DOCS_URL=https://nexus.nyu.edu/docs

# Worker Configuration
AUTO_START_WORKERS=true
```

### 3. Start Notification Worker

Add to your main application file:

```typescript
import { notificationWorker } from './workers/notificationWorker';

// Start worker in production
if (process.env.NODE_ENV === 'production') {
  notificationWorker.start();
}
```

### 4. Register API Routes

Add to Express app:

```typescript
import notificationRoutes from './routes/notifications';

app.use('/api/notifications', notificationRoutes);
```

### 5. Trigger Notifications

When creating a wallet:

```typescript
import { NotificationService } from './services/notificationService';
import { WalletService } from './services/walletService';

// Create wallet
const wallet = await WalletService.createWalletForUser(
  ssoId,
  ssoProvider,
  email,
  firstName,
  lastName
);

// Create in-app notification
await NotificationService.createWalletCreatedNotification(
  wallet.address,
  wallet.address
);

// Queue welcome email
await NotificationService.queueNotification({
  userAddress: wallet.address,
  email: email,
  firstName: firstName,
  lastName: lastName,
  walletAddress: wallet.address,
  network: process.env.APTOS_NETWORK || 'testnet',
  createdAt: new Date(),
});

// Fund wallet (testnet only)
if (process.env.APTOS_NETWORK === 'testnet') {
  const txHash = await WalletService.fundWallet(wallet.address);
  if (txHash) {
    await NotificationService.createWalletFundedNotification(
      wallet.address,
      wallet.address,
      '1',
      txHash
    );
  }
}
```

### 6. Frontend Integration

Wrap your app with notification provider:

```tsx
// app/layout.tsx or _app.tsx
import { NotificationCenterProvider } from '@/components/NotificationCenter';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NotificationCenterProvider>
          {children}
        </NotificationCenterProvider>
      </body>
    </html>
  );
}
```

Add notification center to header:

```tsx
import { NotificationCenter } from '@/components/NotificationCenter';

export function Header() {
  return (
    <header>
      <nav>
        {/* Other nav items */}
        <NotificationCenter />
      </nav>
    </header>
  );
}
```

Show welcome modal on first login:

```tsx
import { WalletWelcomeModal } from '@/components/notifications/WalletWelcomeModal';
import { useEffect, useState } from 'react';

export function Dashboard() {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Check if user just created wallet
    const isFirstLogin = localStorage.getItem('firstLogin');
    if (isFirstLogin === 'true') {
      setShowWelcome(true);
      localStorage.removeItem('firstLogin');
    }
  }, []);

  return (
    <>
      <WalletWelcomeModal
        open={showWelcome}
        onClose={() => setShowWelcome(false)}
        walletAddress={walletAddress}
        network="testnet"
      />
      {/* Dashboard content */}
    </>
  );
}
```

## Testing

Run unit tests:

```bash
cd backend
npm test src/tests/notifications.test.ts
```

Test coverage includes:
- Email sending with various conditions
- In-app notification creation
- Read/unread status management
- User preferences
- Rate limiting
- Email validation
- Queue processing
- Error handling

## Production Considerations

### Email Provider Setup

**SendGrid** (Recommended):
```bash
npm install @sendgrid/mail
```
```env
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=SG.xxxxx
```

**Mailgun**:
```bash
npm install mailgun.js
```
```env
EMAIL_PROVIDER=mailgun
EMAIL_API_KEY=key-xxxxx
EMAIL_DOMAIN=mg.nexus.nyu.edu
```

**AWS SES**:
```bash
npm install @aws-sdk/client-ses
```
```env
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```

### Performance Optimization

1. **Database Indexing**: Already included in migration
2. **Queue Batching**: Process notifications in batches of 10
3. **Rate Limiting**: 1 email per user per 5 minutes
4. **Caching**: Consider caching user preferences
5. **Background Processing**: Use worker for async operations

### Monitoring

Track these metrics:
- Email delivery rate
- Notification read rate
- Queue processing time
- Failed notification count
- User engagement with notifications

### Security

- All emails include unsubscribe links (CAN-SPAM)
- User preferences are respected
- Rate limiting prevents abuse
- Audit logging for compliance
- Encrypted email templates
- HTTPS required for all links

## Support

For issues or questions:
- Backend: Check logs in `backend/logs/`
- Database: Verify migration ran successfully
- Email: Test with SMTP provider first
- Worker: Check worker statistics

## Future Enhancements

Potential improvements:
- Push notifications (mobile/web)
- SMS notifications
- Notification preferences UI
- A/B testing for email templates
- Analytics dashboard
- Notification scheduling
- Multi-language support
- Rich media in notifications

## License

Copyright © 2025 New York University. All rights reserved.
