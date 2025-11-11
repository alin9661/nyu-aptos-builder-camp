# Wallet Security Guide

Your comprehensive guide to understanding and maintaining wallet security at NYU Nexus.

## Public vs Private Keys

Your wallet consists of two cryptographic keys that work together:

### Public Key (Your Address)

**What it is**: A unique identifier for your wallet, similar to a bank account number.

**Your Address**: Visible in your NYU Nexus dashboard

**Safe to Share**:
- ✅ Share with others to receive payments
- ✅ Post publicly to display your wallet
- ✅ Use in transactions and smart contracts
- ✅ View on block explorers

**What it's used for**:
- Receiving funds
- Identifying your account on-chain
- Verifying signatures
- Public transaction history

### Private Key

**What it is**: A secret code that proves ownership of your wallet, like a PIN or password.

**NEVER Share**:
- ❌ Don't share with anyone (including NYU staff)
- ❌ Don't post online or in messages
- ❌ Don't enter on suspicious websites
- ❌ Don't store unencrypted

**What it's used for**:
- Signing transactions
- Proving ownership
- Authorizing operations
- Accessing your funds

### Key Analogy

Think of your wallet like a mailbox:
- **Public Key** = Mailbox address (anyone can send you mail)
- **Private Key** = Mailbox key (only you can open it)

## How We Secure Your Wallet

NYU Nexus uses enterprise-grade security measures to protect your wallet.

### Encryption

**AES-256-GCM Encryption**
- Military-grade encryption standard
- Used by banks and governments worldwide
- Virtually unbreakable with current technology
- Each key encrypted with unique parameters

**How it works**:
1. Your private key is generated
2. Immediately encrypted with AES-256-GCM
3. Stored in encrypted database
4. Only decrypted when signing transactions
5. Never transmitted or exposed

### Access Control

**NYU SSO Integration**
- Only you can authorize transactions
- Multi-factor authentication support
- Session management and timeouts
- IP and device tracking

**Authorization Flow**:
1. You log in with NYU SSO
2. Session token generated
3. Transaction request initiated
4. Private key temporarily decrypted
5. Transaction signed
6. Key immediately re-encrypted

### Secure Storage

**Database Security**:
- Encrypted at rest and in transit
- Restricted access (role-based)
- Regular security audits
- Compliance with data protection regulations

**Backup Strategy**:
- Automatic encrypted backups
- Multiple geographic locations
- Disaster recovery procedures
- Point-in-time recovery capability

### Audit Logging

**Comprehensive Logging**:
- All wallet operations logged
- Transaction history maintained
- Access attempts recorded
- Anomaly detection enabled

**Monitoring**:
- Real-time security alerts
- Suspicious activity detection
- Regular security reviews
- Incident response procedures

### Network Security

**Infrastructure Protection**:
- DDoS protection
- Web application firewall
- Rate limiting
- SSL/TLS encryption for all connections

## Recovery Options

### Account Recovery

Since we manage your wallet, recovery is straightforward:

**If you lose NYU account access**:
1. Contact NYU IT Services
2. Follow NYU account recovery procedures
3. Regain access to your NYU SSO
4. Automatically regain wallet access

**What we backup**:
- Encrypted private keys
- Account metadata
- Transaction history
- Notification preferences

**What you DON'T need to remember**:
- ❌ No seed phrases
- ❌ No private key backups
- ❌ No recovery passwords
- ✅ Just your NYU credentials

### Cannot Access NYU Account?

Contact NYU IT Support:
- **Email**: [it.help@nyu.edu](mailto:it.help@nyu.edu)
- **Phone**: (212) 998-3333
- **Website**: [nyu.edu/it](https://nyu.edu/it)

## Best Practices

### Protect Your NYU Credentials

**Strong Password**:
- Use 12+ characters
- Mix uppercase, lowercase, numbers, symbols
- Avoid personal information
- Don't reuse passwords

**Two-Factor Authentication**:
- Enable 2FA on your NYU account
- Use authenticator app (preferred over SMS)
- Keep backup codes safe
- Update phone number regularly

**Session Security**:
- Always log out when done
- Don't save passwords on shared devices
- Use private/incognito mode on public computers
- Clear browser cache after use

### Verify Transaction Details

**Before Signing**:
1. ✅ Check recipient address carefully
2. ✅ Verify amount and token type
3. ✅ Review gas fees
4. ✅ Confirm action matches intention
5. ✅ Double-check on important transactions

**Warning Signs**:
- ⚠️ Unexpected transaction requests
- ⚠️ Unusually high gas fees
- ⚠️ Unknown recipient addresses
- ⚠️ Pressure to act quickly

### Beware of Phishing

**Common Phishing Tactics**:
- Fake emails claiming to be from NYU
- Suspicious login pages
- Urgent security warnings
- Requests for your password

**How to Protect Yourself**:
1. **Check URLs**: Only use official NYU domains
2. **Verify Emails**: Look for official NYU email addresses
3. **Don't Click Suspicious Links**: Type URLs directly
4. **Report Phishing**: Forward to [security@nyu.edu](mailto:security@nyu.edu)

**Official NYU Nexus Domains**:
- ✅ nexus.nyu.edu
- ✅ *.nyu.edu
- ❌ nexus-nyu.com (fake)
- ❌ nyu-nexus.net (fake)

### Never Share Private Keys

**We will NEVER ask for**:
- Your NYU password
- Your private key
- Seed phrases or recovery codes
- Credit card information via email

**If someone asks**:
1. Stop immediately
2. Do not provide information
3. Report to security@nyu.edu
4. Change your password if compromised

### Use Hardware Wallets (Future)

For very large holdings, hardware wallets provide additional security:
- **What they are**: Physical devices that store private keys
- **How they work**: Sign transactions offline
- **Benefits**: Protection from online attacks
- **Note**: Currently, NYU Nexus manages keys; hardware wallet support may come in future

## Common Scams to Avoid

### Email Phishing

**Example**: "Your wallet has been compromised. Click here to secure it immediately."

**Red Flags**:
- Urgent language
- Suspicious sender
- Requests for credentials
- Misspelled domains

**Action**: Delete and report

### Fake Support

**Example**: Someone claiming to be NYU support asks for your password to "fix an issue."

**Reality**: Real support never asks for passwords

**Action**: Verify through official channels before sharing any information

### Malicious Websites

**Example**: A site that looks like NYU Nexus but has a slightly different URL.

**Red Flags**:
- Wrong domain (nexus-nyu.com instead of nexus.nyu.edu)
- Missing SSL certificate
- Poor design or typos
- Asks for private key

**Action**: Close immediately and report

### Social Engineering

**Example**: "I'm from IT and need to test your account. Please provide your credentials."

**Reality**: IT never requests credentials for testing

**Action**: Verify identity through official channels, report attempt

### Impersonation

**Example**: Someone on Discord/Telegram claims to represent NYU Nexus and offers "support."

**Reality**: Official support only through verified channels

**Action**: Ignore and report

## Security Checklist

### Daily
- [ ] Log out after each session
- [ ] Check for unusual activity
- [ ] Verify transaction details before confirming

### Weekly
- [ ] Review recent transactions
- [ ] Check notification settings
- [ ] Update software and apps

### Monthly
- [ ] Change NYU password
- [ ] Review connected devices
- [ ] Audit account activity

### Quarterly
- [ ] Review security settings
- [ ] Update recovery information
- [ ] Check for security updates from NYU

## Reporting Security Issues

### If You Notice Suspicious Activity

**Immediate Actions**:
1. Change your NYU password
2. Log out of all sessions
3. Review recent transactions
4. Contact support immediately

**Report To**:
- **NYU Nexus Support**: [support@nexus.nyu.edu](mailto:support@nexus.nyu.edu)
- **NYU Security**: [security@nyu.edu](mailto:security@nyu.edu)
- **NYU IT Help Desk**: (212) 998-3333

**Information to Provide**:
- Your wallet address
- Description of suspicious activity
- Time and date
- Any relevant screenshots
- Transaction hashes (if applicable)

### Response Time

- **Critical Issues**: Within 1 hour
- **High Priority**: Within 4 hours
- **Normal Issues**: Within 24 hours

## Additional Resources

- [Aptos Security Best Practices](https://aptos.dev/guides/security-best-practices/)
- [NYU IT Security](https://www.nyu.edu/life/information-technology/cybersecurity.html)
- [Two-Factor Authentication Guide](https://www.nyu.edu/life/information-technology/infrastructure/identity-and-access-management/multi-factor-authentication.html)

## FAQs

**Q: Can NYU staff see my private key?**
A: No. Private keys are encrypted and can only be used to sign transactions authorized by you through SSO.

**Q: What if NYU Nexus is hacked?**
A: We use multiple layers of security, encrypted storage, and regular backups. In the unlikely event of a breach, we have incident response procedures and will notify affected users immediately.

**Q: Can I transfer my wallet to another service?**
A: Currently, wallets are managed by NYU Nexus and cannot be exported. This is by design to ensure maximum security and ease of use.

**Q: Is my wallet insured?**
A: Contact NYU administration for information about institutional insurance policies.

---

**Questions?** Contact [support@nexus.nyu.edu](mailto:support@nexus.nyu.edu) or visit our [support center](/support).
