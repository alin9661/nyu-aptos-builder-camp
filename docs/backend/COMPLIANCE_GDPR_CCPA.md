# GDPR & CCPA Compliance Guide

## Table of Contents
1. [Overview](#overview)
2. [Legal Framework](#legal-framework)
3. [Data Processing Activities](#data-processing-activities)
4. [User Rights](#user-rights)
5. [Audit Logging](#audit-logging)
6. [Data Retention](#data-retention)
7. [Consent Management](#consent-management)
8. [Security Monitoring](#security-monitoring)
9. [Incident Response](#incident-response)
10. [Compliance Checklist](#compliance-checklist)
11. [API Reference](#api-reference)

---

## Overview

This document outlines the GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act) compliance measures implemented in the NYU x Aptos platform.

### Key Compliance Features

- **Comprehensive Audit Logging**: All wallet operations are logged with timestamps, IP addresses, and user agents
- **User Rights Management**: GDPR Articles 15, 16, 17, 20 and CCPA rights fully implemented
- **Consent Management**: Granular consent tracking with version control
- **Data Retention**: Automated 2-year retention policy with anonymization
- **Security Monitoring**: Real-time detection of suspicious activities
- **Blockchain Considerations**: Special handling for immutable blockchain data

---

## Legal Framework

### GDPR (European Union)

The General Data Protection Regulation applies to:
- Processing of personal data of individuals in the EU
- Offering goods/services to EU residents
- Monitoring behavior of individuals in the EU

**Key Articles Implemented:**
- **Article 7**: Conditions for Consent
- **Article 15**: Right of Access
- **Article 16**: Right to Rectification
- **Article 17**: Right to Erasure (Right to be Forgotten)
- **Article 20**: Right to Data Portability
- **Article 30**: Records of Processing Activities (Audit Logs)
- **Article 32**: Security of Processing

### CCPA (California, USA)

The California Consumer Privacy Act applies to:
- Businesses doing business in California
- Collecting personal information of California residents

**Key Rights Implemented:**
- **Right to Know**: What personal information is collected
- **Right to Delete**: Request deletion of personal information
- **Right to Opt-Out**: Opt-out of sale of personal information (not applicable - we don't sell data)

---

## Data Processing Activities

### Personal Data Collected

| Data Type | Purpose | Legal Basis | Retention Period |
|-----------|---------|-------------|------------------|
| SSO ID (NetID) | Authentication | Legitimate Interest | Account lifetime |
| Email Address | Communication | Consent | Account lifetime |
| Wallet Address | Blockchain identity | Legitimate Interest | Permanent (blockchain) |
| IP Address | Security & fraud prevention | Legitimate Interest | 2 years |
| User Agent | Security monitoring | Legitimate Interest | 2 years |
| Audit Logs | Compliance & security | Legal Obligation | 2 years |

### Special Categories

**Blockchain Data:**
- Wallet addresses and transactions are permanently stored on the Aptos blockchain
- Cannot be deleted due to technical limitations (immutability)
- Covered under GDPR Article 17(3) exceptions (technical impossibility)

**Encrypted Private Keys:**
- Stored with AES-256 encryption
- Only decrypted for transaction signing
- Can be deleted upon user request
- Access is logged for security

---

## User Rights

### 1. Right of Access (GDPR Article 15)

Users can request a copy of their personal data.

**Implementation:**
- Endpoint: `GET /api/compliance/data/export`
- Returns: Complete user data in JSON format
- Includes: User info, wallet details, audit logs, consents, governance activity

**Example Request:**
```bash
curl -X GET https://api.example.com/api/compliance/data/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Right to Rectification (GDPR Article 16)

Users can correct inaccurate personal data.

**Implementation:**
- Endpoint: `PUT /api/compliance/data/rectify`
- Updatable fields: email, displayName, firstName, lastName
- Changes are logged in audit trail

**Example Request:**
```bash
curl -X PUT https://api.example.com/api/compliance/data/rectify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newemail@nyu.edu",
    "displayName": "Updated Name"
  }'
```

### 3. Right to Erasure (GDPR Article 17)

Users can request deletion of their personal data.

**Implementation:**
- Endpoint: `POST /api/compliance/data/delete`
- Requires confirmation: `"DELETE_MY_DATA"`
- Grace period: 30 days for consent revocations
- Returns detailed deletion report

**What Gets Deleted:**
- Personal information (name, email)
- SSO identifiers
- Encrypted private keys
- IP addresses and user agents

**What Gets Anonymized:**
- Audit logs (retained for compliance)
- Security alerts

**What Cannot Be Deleted:**
- Blockchain transactions (technical impossibility)
- Governance votes (organizational integrity)

**Example Request:**
```bash
curl -X POST https://api.example.com/api/compliance/data/delete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "DELETE_MY_DATA",
    "requestType": "gdpr",
    "deleteBlockchainData": false
  }'
```

### 4. Right to Data Portability (GDPR Article 20)

Users can receive their data in a machine-readable format.

**Implementation:**
- Endpoint: `GET /api/compliance/data/export/json`
- Format: JSON (machine-readable)
- Exports valid for 30 days

**Example Request:**
```bash
curl -X GET https://api.example.com/api/compliance/data/export/json \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o my-data.json
```

### 5. CCPA Rights

**Right to Know:**
Same as GDPR Right of Access - use data export endpoint.

**Right to Delete:**
Same as GDPR Right to Erasure - use data deletion endpoint with `"requestType": "ccpa"`.

**Right to Opt-Out:**
Not applicable - we do not sell personal information.

---

## Audit Logging

### What is Logged

Every operation is logged with:
- Event ID (UUID for correlation)
- User address and SSO ID
- Event type and category
- Operation and status
- IP address and user agent
- Timestamp (UTC)
- Request ID (for correlation)
- Metadata (additional context)

### Event Types

**Authentication:**
- `authentication_success`: Successful login
- `authentication_failure`: Failed login attempt

**Wallet:**
- `wallet_generated`: New wallet created
- `wallet_accessed`: Private key decrypted
- `wallet_funded`: Wallet funded from faucet
- `wallet_exported`: User exported wallet info

**Compliance:**
- `consent_granted`: User granted consent
- `consent_revoked`: User revoked consent
- `data_exported`: GDPR data export
- `data_deletion_requested`: GDPR deletion request

**Security:**
- `high_wallet_access_frequency`: Suspicious activity detected
- `rate_limit_exceeded`: Rate limit violation

### Accessing Audit Logs

Users can view their complete audit trail:

```bash
curl -X GET "https://api.example.com/api/compliance/audit-trail?limit=100" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Retention Period

- **Active Logs**: Kept for 2 years
- **After 2 Years**: Automatically anonymized
- **Legal Requirement**: GDPR Article 30 requires maintaining records

---

## Data Retention

### Policy Summary

| Data Type | Retention Period | Action After Period |
|-----------|------------------|---------------------|
| Audit Logs | 2 years | Anonymized |
| Personal Data | Account lifetime | Deleted on request |
| Anonymized Logs | Indefinite | Kept for analytics |
| Blockchain Data | Permanent | Cannot be deleted |
| Export Requests | 30 days | Automatically deleted |

### Automated Retention Job

A cron job runs daily at 2 AM to:
1. Anonymize audit logs older than 2 years
2. Process consent revocations (30-day grace period)
3. Delete expired data exports
4. Clean up old security alerts
5. Generate retention reports

**Manual Execution:**
```typescript
import { runDataRetentionJobNow } from './jobs/dataRetention';

const stats = await runDataRetentionJobNow();
console.log(stats);
```

**Job Status:**
```bash
curl -X GET https://api.example.com/api/admin/retention/status \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Consent Management

### Consent Types

1. **wallet_generation**: Auto wallet creation upon SSO (Required)
2. **private_key_storage**: Server-side encrypted key storage (Required)
3. **data_processing**: General data processing (Required)
4. **analytics**: Anonymous usage analytics (Optional)
5. **notifications**: Email/push notifications (Optional)
6. **third_party_sharing**: Sharing with third parties (Optional)

### Consent Lifecycle

1. **Initial Consent**: Collected during onboarding
2. **Version Tracking**: Each consent has a version number
3. **Withdrawal**: Users can revoke consent at any time
4. **Grace Period**: 30 days before data deletion after revocation
5. **Re-consent**: Users can grant consent again

### Granting Consent

```bash
curl -X POST https://api.example.com/api/compliance/consent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "consentType": "analytics",
    "version": "1.0"
  }'
```

### Revoking Consent

```bash
curl -X DELETE https://api.example.com/api/compliance/consent/analytics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Checking Consent Status

```bash
curl -X GET https://api.example.com/api/compliance/consent/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Security Monitoring

### Monitored Activities

1. **High Wallet Access Frequency**: >10 accesses per hour
2. **Failed Wallet Generation**: >5 failures per hour
3. **Failed Authentication**: >5 failures per hour
4. **Bulk Data Exports**: >3 exports per day
5. **Multiple Consent Revocations**: >5 per day
6. **Geographic Anomalies**: >3 different IPs per hour

### Alert Severity Levels

- **Low**: Informational, no action required
- **Medium**: Worth investigating
- **High**: Requires immediate attention
- **Critical**: Potential security breach

### Alert Notifications

Alerts are sent via:
- System logs (Winston)
- Email (configurable)
- Slack webhook (configurable)
- Custom webhooks (configurable)

### Reviewing Alerts

```bash
curl -X GET https://api.example.com/api/admin/security/alerts \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## Incident Response

### Data Breach Procedure

If a data breach is detected:

1. **Immediate Actions** (Within 1 hour)
   - Contain the breach
   - Assess the scope
   - Secure affected systems
   - Document everything

2. **Notification** (Within 72 hours - GDPR requirement)
   - Notify supervisory authority
   - Notify affected users if high risk
   - Document notification process

3. **Investigation**
   - Review audit logs
   - Identify root cause
   - Assess data exposed
   - Document findings

4. **Remediation**
   - Fix vulnerabilities
   - Implement additional controls
   - Update security procedures
   - Train staff

5. **Post-Incident**
   - Generate incident report
   - Update compliance documentation
   - Conduct lessons learned session

### Contact Information

**Data Protection Officer (DPO):**
- Email: privacy@example.com
- Phone: [To be added]

**Supervisory Authority:**
- [To be determined based on jurisdiction]

---

## Compliance Checklist

### Initial Setup
- [ ] Database migrations applied (`003_add_wallet_audit_logs.sql`)
- [ ] Audit service configured
- [ ] Compliance service initialized
- [ ] Data retention job scheduled
- [ ] Security monitoring active

### Ongoing Compliance
- [ ] Audit logs reviewed monthly
- [ ] Security alerts addressed within 24 hours
- [ ] Data export requests fulfilled within 30 days
- [ ] Deletion requests processed within 30 days
- [ ] Consent records maintained
- [ ] Retention policy applied automatically
- [ ] Compliance reports generated quarterly

### Documentation
- [ ] Privacy policy published
- [ ] Terms of service updated
- [ ] Data processing agreements signed
- [ ] User rights documentation available
- [ ] Incident response plan documented
- [ ] Staff training completed

### Technical Controls
- [ ] Encryption at rest (AES-256)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Access controls implemented
- [ ] Rate limiting configured
- [ ] Logging comprehensive
- [ ] Backups encrypted

---

## API Reference

### Compliance Endpoints

#### Get Compliance Information
```
GET /api/compliance/info
Authorization: Not required
```

Returns overview of GDPR/CCPA rights and endpoints.

#### Grant Consent
```
POST /api/compliance/consent
Authorization: Required
Body: {
  "consentType": "analytics",
  "version": "1.0"
}
```

#### Revoke Consent
```
DELETE /api/compliance/consent/:type
Authorization: Required
```

#### Get Consent Status
```
GET /api/compliance/consent/status
Authorization: Required
```

#### Export User Data
```
GET /api/compliance/data/export
Authorization: Required
Query: format=json|csv|xml
```

#### Delete User Data
```
POST /api/compliance/data/delete
Authorization: Required
Body: {
  "confirmation": "DELETE_MY_DATA",
  "requestType": "gdpr"|"ccpa"|"user_initiated",
  "deleteBlockchainData": false
}
```

#### Rectify User Data
```
PUT /api/compliance/data/rectify
Authorization: Required
Body: {
  "email": "string",
  "displayName": "string",
  "firstName": "string",
  "lastName": "string"
}
```

#### Get Audit Trail
```
GET /api/compliance/audit-trail
Authorization: Required
Query: startDate, endDate, limit, offset
```

### Response Format

All endpoints return JSON in this format:

**Success:**
```json
{
  "success": true,
  "data": {...},
  "message": "Operation completed successfully"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

---

## Privacy Policy Template

Include in your privacy policy:

### Data We Collect
- NYU NetID (for authentication)
- Email address (for communication)
- Wallet address (blockchain identity)
- IP address and user agent (security)
- Usage data (analytics, with consent)

### How We Use Data
- Authentication and access control
- Transaction signing and blockchain operations
- Security monitoring and fraud prevention
- Platform improvement (with consent)
- Legal compliance

### Your Rights
Under GDPR and CCPA, you have the right to:
- Access your personal data
- Correct inaccurate data
- Request deletion of your data
- Export your data in machine-readable format
- Withdraw consent at any time
- Object to data processing
- Lodge a complaint with supervisory authority

### Data Retention
- Personal data: Stored while account is active
- Audit logs: 2 years, then anonymized
- Blockchain data: Permanent (technical limitation)

### Security
- AES-256 encryption for private keys
- TLS 1.3 for data in transit
- Comprehensive audit logging
- Regular security monitoring

### Contact
For privacy inquiries: privacy@example.com

---

## Blockchain-Specific Considerations

### Immutability Challenge

Blockchain data is **permanently immutable**:
- Wallet addresses are public
- Transactions cannot be deleted
- Votes cannot be erased

### GDPR Compliance Strategy

1. **Article 17(3) Exceptions**: Technical impossibility
2. **Minimize On-Chain Data**: Only essential data on blockchain
3. **Off-Chain Personal Data**: Can be deleted
4. **Pseudonymity**: Wallet addresses are pseudonymous

### User Notice

Users must be informed:
> "Blockchain transactions are permanently recorded and cannot be deleted due to the immutable nature of blockchain technology. This is a technical limitation and qualifies as an exception under GDPR Article 17(3)."

---

## Best Practices

1. **Privacy by Design**
   - Minimize data collection
   - Use pseudonymization where possible
   - Implement data protection from the start

2. **Regular Audits**
   - Review access logs monthly
   - Audit compliance quarterly
   - Test incident response annually

3. **Staff Training**
   - GDPR/CCPA awareness
   - Data handling procedures
   - Incident response protocols

4. **Documentation**
   - Maintain processing records
   - Document design decisions
   - Keep audit trails

5. **User Transparency**
   - Clear privacy policy
   - Easy-to-use rights requests
   - Prompt responses

---

## Resources

### GDPR Resources
- [Official GDPR Text](https://gdpr-info.eu/)
- [ICO Guide](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/)

### CCPA Resources
- [Official CCPA Text](https://oag.ca.gov/privacy/ccpa)
- [CCPA Compliance Guide](https://www.oag.ca.gov/privacy/ccpa/regs)

### Blockchain & GDPR
- [Blockchain and GDPR by EU Blockchain Observatory](https://www.eublockchainforum.eu/sites/default/files/reports/20181016_report_gdpr.pdf)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-11 | Initial compliance documentation |

---

**Document Owner**: Data Protection Officer
**Last Reviewed**: 2025-11-11
**Next Review**: 2026-02-11 (Quarterly)
