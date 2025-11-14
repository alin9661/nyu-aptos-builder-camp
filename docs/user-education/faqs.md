# Frequently Asked Questions (FAQs)

Find answers to common questions about NYU Nexus, wallets, and blockchain.

## Wallet Basics

### What is my wallet address?

Your wallet address is a unique 66-character string starting with "0x" that identifies your account on the Aptos blockchain. You can find it:
- On your wallet dashboard
- In the welcome email you received
- By clicking your profile icon

Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### Can I export my private key?

No. For security reasons, private keys cannot be exported from NYU Nexus. We use a custodial wallet model, meaning we securely manage your private keys using AES-256-GCM encryption. This approach:
- Eliminates risk of lost keys
- Simplifies user experience
- Provides institutional-grade security
- Enables account recovery through NYU SSO

### What happens if I lose access to my account?

Since your wallet is tied to your NYU SSO account:
1. Your wallet remains secure and accessible
2. Contact NYU IT Services to recover your NYU account
3. Once you regain NYU access, you automatically regain wallet access
4. Your funds and transaction history are never lost

**NYU IT Help**: (212) 998-3333 or [it.help@nyu.edu](mailto:it.help@nyu.edu)

### Is my wallet secure?

Yes! Your wallet is protected by:
- **AES-256-GCM encryption** (military-grade security)
- **NYU SSO authentication** (only you can authorize transactions)
- **Encrypted backups** (multiple secure locations)
- **Audit logging** (all activity monitored)
- **Network security** (DDoS protection, firewalls, SSL/TLS)

We follow industry best practices and undergo regular security audits.

### What network is this on (testnet/mainnet)?

Check your wallet dashboard to see which network you're using:
- **Testnet**: Used for development and learning. Tokens have no real-world value.
- **Mainnet**: The production network where tokens have real value.

The network is configured by your administrator and displayed with a badge on your wallet page.

## Getting APT Tokens

### How do I get more APT?

**On Testnet**:
- Request tokens from your administrator
- Use the Aptos faucet (if available)
- Testnet APT is free and has no monetary value

**On Mainnet**:
- Receive from another wallet
- Purchase from cryptocurrency exchanges (Coinbase, Binance, etc.)
- Receive as payment or reimbursement
- Contact your treasurer for organizational funding

### Can I buy APT with a credit card?

NYU Nexus doesn't directly support purchasing APT. However, you can:
1. Buy APT on a cryptocurrency exchange (e.g., Coinbase)
2. Send it to your NYU Nexus wallet address
3. Use it within the platform

**Note**: Check with your administrator about organizational funding policies.

### How do I send APT to someone?

Currently, NYU Nexus is designed for governance and reimbursements. Direct wallet-to-wallet transfers may not be enabled. Check with your administrator about available features.

If transfers are enabled:
1. Go to Wallet page
2. Click "Send"
3. Enter recipient address
4. Specify amount
5. Review and confirm
6. Sign transaction

## Transaction Questions

### What are transaction fees?

Transaction fees (gas fees) are small amounts of APT paid to validators who process your transaction. On Aptos, fees are typically:
- Simple transactions: 0.0001 - 0.001 APT (~$0.001 - $0.01)
- Complex operations: May cost slightly more
- Very affordable compared to other blockchains

Fees are automatically deducted from your balance when you sign a transaction.

### Why did my transaction fail?

Common reasons for transaction failure:
1. **Insufficient balance**: Not enough APT to cover gas fees
2. **Network congestion**: Temporary network issues (rare on Aptos)
3. **Invalid operation**: Transaction parameters were incorrect
4. **Expired transaction**: Transaction took too long to process
5. **Signature mismatch**: Private key issue (contact support)

**Solution**: Check your balance, wait a moment, and try again. If the issue persists, contact support with the transaction hash.

### How long do transactions take?

Aptos is one of the fastest blockchains:
- **Typical confirmation time**: Less than 1 second
- **Finality**: Transactions are irreversible after confirmation
- **Network status**: Check [Aptos Explorer](https://explorer.aptoslabs.com) for current performance

If a transaction takes longer than 10 seconds, there may be an issue. Contact support if needed.

### Can I cancel a transaction?

Once a transaction is submitted and confirmed on the blockchain, it **cannot be cancelled or reversed**. This is a fundamental property of blockchain technology.

**Before confirming**:
- Carefully review all details
- Check recipient address
- Verify amounts
- Ensure sufficient balance for gas

**If you made a mistake**:
- Contact the recipient to request a return
- Contact support for assistance
- Transaction history is permanent on blockchain

## Using the Platform

### Can I use this wallet in other apps?

Currently, no. NYU Nexus wallets are custodial and managed specifically for use within the platform. This design:
- Ensures maximum security
- Simplifies user experience
- Meets institutional requirements
- Protects against external vulnerabilities

Future updates may enable limited external integrations. Check with your administrator for updates.

### How do I vote on a proposal?

1. Navigate to "Governance" page
2. Select an active proposal
3. Read the full description and discussion
4. Click your choice: "For," "Against," or "Abstain"
5. Review transaction details
6. Sign the transaction
7. Receive confirmation

Your vote is permanently recorded on the blockchain and publicly visible.

### Can I change my vote?

No. Once a vote is cast and confirmed on the blockchain, it cannot be changed. This ensures:
- Vote integrity
- Transparency
- Fair governance
- Prevents manipulation

**Best practice**: Read proposals carefully before voting.

### How do I submit a reimbursement?

1. Go to "Reimbursements" page
2. Click "Submit New Request"
3. Fill out form with:
   - Description of expense
   - Amount
   - Category
   - Receipt/documentation
4. Review and submit
5. Transaction is recorded on blockchain
6. Track status in your dashboard

### When will I receive my reimbursement?

Timing depends on your organization's approval process:
- **Review period**: 1-7 days (varies by organization)
- **Approval vote**: If required, depends on voting period
- **Payment processing**: Usually within 24 hours after approval
- **Blockchain confirmation**: Instant once funds are sent

You'll receive notifications at each stage.

### Who approves reimbursements?

This depends on your organization's governance structure:
- **Treasurer**: May have authority to approve directly
- **Board/Committee**: May vote on requests above a certain amount
- **Members**: May vote democratically on all requests

Check your organization's bylaws for specific approval procedures.

## Technical Questions

### What blockchain does NYU Nexus use?

NYU Nexus is built on **Aptos**, a Layer 1 blockchain known for:
- High performance (160,000+ TPS)
- Sub-second finality
- Move programming language
- Strong safety guarantees
- Low transaction fees

Learn more: [Aptos Basics](./aptos-basics.md)

### What is an Octa?

An Octa is the smallest unit of APT, similar to how:
- Bitcoin has satoshis
- Ethereum has wei
- Dollars have cents

**Conversion**: 1 APT = 100,000,000 Octas

Octas allow for precise calculations and microtransactions without decimal errors.

### What is a block explorer?

A block explorer is a web-based tool that lets you search and view blockchain data:
- Transaction details and status
- Account balances and history
- Smart contract code
- Network statistics

**Aptos Explorer**: [explorer.aptoslabs.com](https://explorer.aptoslabs.com)

### What is gas?

Gas is a measure of computational work required to execute a transaction. Each operation consumes gas:
- Token transfer: ~5-10 gas units
- Vote on proposal: ~10-50 gas units
- Complex contract: 100+ gas units

**Gas fee** = Gas used × Gas price (in Octas)

### Can I see my transaction on the blockchain?

Yes! All transactions are public on the Aptos blockchain:
1. Copy your transaction hash
2. Visit [Aptos Explorer](https://explorer.aptoslabs.com)
3. Paste hash in search bar
4. View complete transaction details

This transparency ensures accountability and verifiability.

## Security & Privacy

### Who can see my transactions?

**Public information** (visible to everyone):
- Your wallet address
- Transaction amounts and timestamps
- Smart contract interactions
- Vote records

**Private information** (encrypted/not stored):
- Your private key (encrypted)
- Your NYU password (never stored)
- Personal information (only with permission)

Blockchain is transparent by design, but personal data is protected.

### Is my identity public?

Your **wallet address** is public, but it's not directly linked to your personal identity on the blockchain. However:
- Within NYU Nexus, your display name may be visible to other members
- Voting records may show your name (depending on governance rules)
- Transaction history is pseudonymous (address-based)

### Can transactions be traced back to me?

Within NYU Nexus, yes—transactions are linked to your account for governance purposes. On the public blockchain, transactions are linked to your wallet address, which is pseudonymous.

### What data does NYU Nexus collect?

We collect only what's necessary:
- **Account info**: Name, email, NetID (from NYU SSO)
- **Wallet data**: Address, transaction history (public on blockchain)
- **Usage data**: Login times, IP addresses (for security)
- **Preferences**: Notification settings, display preferences

We follow GDPR and university data protection policies.

## Account Management

### How do I change my email?

1. Go to Settings
2. Click "Profile"
3. Update email address
4. Verify new email
5. Save changes

**Note**: Your primary NYU email may be locked and require IT assistance to change.

### How do I enable two-factor authentication?

2FA is managed through your NYU SSO account:
1. Visit [NYU Account Security](https://www.nyu.edu/life/information-technology/identity-and-access-management/multi-factor-authentication.html)
2. Follow NYU's 2FA setup instructions
3. Choose authenticator app or SMS
4. Save backup codes
5. 2FA will apply to NYU Nexus automatically

### Can I have multiple wallets?

Each NYU account is associated with one wallet address. Multiple wallets are not currently supported, as your wallet is tied to your institutional identity.

If you need separate wallets for different purposes, contact your administrator.

### How do I delete my account?

Contact your NYU Nexus administrator to request account closure. Note:
- Blockchain transaction history is permanent
- Wallet can be archived but not deleted from blockchain
- Personal data will be removed per privacy policies
- Remaining funds should be transferred before closure

## Troubleshooting

### I can't log in

**Steps to resolve**:
1. Verify you're using correct NetID and password
2. Check that NYU SSO is working: [start.nyu.edu](https://start.nyu.edu)
3. Clear browser cache and cookies
4. Try a different browser or incognito mode
5. Disable browser extensions temporarily
6. Contact NYU IT if account is locked: (212) 998-3333

### My transaction is pending for a long time

**Normal**: Aptos transactions confirm in <1 second
**If stuck**:
1. Check Aptos Explorer for transaction status
2. Verify network connectivity
3. Wait 5 minutes and refresh
4. If still pending after 10 minutes, contact support with transaction hash

### I'm not receiving notifications

**Check**:
1. Email address is correct in settings
2. Notifications are enabled in preferences
3. Check spam/junk folder
4. Whitelist emails from nexus.nyu.edu
5. Browser notifications are allowed
6. Contact support if issue persists

### Balance showing as zero

**Possible causes**:
1. Wallet is newly created (normal)
2. Network connection issue (refresh page)
3. RPC node delay (rare, usually resolves in seconds)
4. Browser cache issue (clear cache)

If balance should not be zero, check Aptos Explorer with your wallet address to verify on-chain balance.

### Page won't load

**Troubleshooting**:
1. Check internet connection
2. Try refreshing the page (Ctrl+R or Cmd+R)
3. Clear browser cache
4. Try different browser
5. Check [status.nyu.edu](https://status.nyu.edu) for outages
6. Contact support if persists

## Getting More Help

### How do I contact support?

**Email**:
- General support: [support@nexus.nyu.edu](mailto:support@nexus.nyu.edu)
- Security issues: [security@nyu.edu](mailto:security@nyu.edu)
- NYU IT: [it.help@nyu.edu](mailto:it.help@nyu.edu)

**Phone**:
- NYU IT Help Desk: (212) 998-3333 (24/7)

**In-Person**:
- Visit NYU IT Service Desk during business hours

**Response Time**:
- Critical issues: <1 hour
- High priority: <4 hours
- Normal requests: <24 hours

### What information should I provide when contacting support?

**Include**:
- Your wallet address
- Description of the issue
- Steps to reproduce
- Screenshots (if applicable)
- Transaction hash (for transaction issues)
- Browser and operating system
- Time and date of issue

**Never share**:
- Your NYU password
- Your private key (we never ask for this)
- Recovery phrases (N/A for NYU Nexus)

### Where can I learn more?

**Documentation**:
- [Getting Started Guide](./getting-started.md)
- [Aptos Basics](./aptos-basics.md)
- [Wallet Security](./wallet-security.md)

**External Resources**:
- [Aptos Documentation](https://aptos.dev)
- [Aptos Learn](https://aptoslabs.com/learn)
- [Move Programming Language](https://move-language.github.io/move/)

**Community**:
- Join NYU Nexus community discussions
- Attend office hours or training sessions
- Participate in governance forums

---

**Still have questions?** Contact [support@nexus.nyu.edu](mailto:support@nexus.nyu.edu)

**Found a bug or security issue?** Report to [security@nyu.edu](mailto:security@nyu.edu)
