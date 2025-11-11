-- Migration: 003_add_wallet_audit_logs.sql
-- Description: Add comprehensive audit logging and compliance tables
-- Date: 2025-11-11
-- Purpose: GDPR, CCPA, and blockchain compliance tracking

BEGIN;

-- ============================================================================
-- WALLET AUDIT LOGS TABLE
-- ============================================================================
-- Tracks all wallet-related operations for compliance and security monitoring
-- Event Types:
--   - wallet_generated: New wallet created
--   - wallet_assigned: Wallet linked to user
--   - wallet_accessed: Private key decrypted for signing
--   - wallet_funded: Wallet funded from faucet
--   - wallet_exported: User exported wallet info
--   - consent_granted: User granted data processing consent
--   - consent_revoked: User revoked consent
--   - data_deletion_requested: GDPR/CCPA deletion request
--   - data_exported: User data export (GDPR Article 20)
--   - authentication_success: User login
--   - authentication_failure: Failed login attempt
--   - transaction_signed: Transaction signed with wallet
--   - api_access: API endpoint accessed

CREATE TABLE IF NOT EXISTS wallet_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_address VARCHAR(66),
  sso_id VARCHAR(255),
  event_type VARCHAR(100) NOT NULL,
  event_category VARCHAR(50) NOT NULL CHECK (event_category IN ('authentication', 'wallet', 'compliance', 'security', 'transaction')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  wallet_address VARCHAR(66),
  operation VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failure', 'pending')),
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255)
);

-- Indexes for efficient querying
CREATE INDEX idx_wallet_audit_user ON wallet_audit_logs(user_address) WHERE user_address IS NOT NULL;
CREATE INDEX idx_wallet_audit_wallet ON wallet_audit_logs(wallet_address) WHERE wallet_address IS NOT NULL;
CREATE INDEX idx_wallet_audit_event_type ON wallet_audit_logs(event_type);
CREATE INDEX idx_wallet_audit_created_at ON wallet_audit_logs(created_at DESC);
CREATE INDEX idx_wallet_audit_status ON wallet_audit_logs(status);
CREATE INDEX idx_wallet_audit_sso_id ON wallet_audit_logs(sso_id) WHERE sso_id IS NOT NULL;
CREATE INDEX idx_wallet_audit_event_category ON wallet_audit_logs(event_category);
CREATE INDEX idx_wallet_audit_severity ON wallet_audit_logs(severity);
CREATE INDEX idx_wallet_audit_event_id ON wallet_audit_logs(event_id);

-- Composite indexes for common queries
CREATE INDEX idx_wallet_audit_user_date ON wallet_audit_logs(user_address, created_at DESC) WHERE user_address IS NOT NULL;
CREATE INDEX idx_wallet_audit_category_date ON wallet_audit_logs(event_category, created_at DESC);

-- Comment on table
COMMENT ON TABLE wallet_audit_logs IS 'Comprehensive audit log for all wallet operations. Retention: 2 years for GDPR compliance.';
COMMENT ON COLUMN wallet_audit_logs.event_id IS 'Unique identifier for event correlation and tracking';
COMMENT ON COLUMN wallet_audit_logs.metadata IS 'Additional structured data about the event (JSON format)';
COMMENT ON COLUMN wallet_audit_logs.created_at IS 'Timestamp in UTC for GDPR compliance';

-- ============================================================================
-- USER CONSENTS TABLE
-- ============================================================================
-- Tracks user consent for data processing (GDPR Article 7)
-- Consent Types:
--   - wallet_generation: Auto wallet creation consent
--   - private_key_storage: Server-side key storage consent
--   - data_processing: General data processing consent
--   - analytics: Usage analytics consent
--   - notifications: Email/push notifications consent
--   - third_party_sharing: Sharing data with third parties

CREATE TABLE IF NOT EXISTS user_consents (
  id BIGSERIAL PRIMARY KEY,
  user_address VARCHAR(66) NOT NULL,
  consent_type VARCHAR(100) NOT NULL,
  consent_version VARCHAR(20) NOT NULL,
  granted BOOLEAN NOT NULL,
  granted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_consent UNIQUE (user_address, consent_type)
);

-- Indexes for consent lookups
CREATE INDEX idx_user_consents_user ON user_consents(user_address);
CREATE INDEX idx_user_consents_type ON user_consents(consent_type);
CREATE INDEX idx_user_consents_granted ON user_consents(granted);
CREATE INDEX idx_user_consents_updated_at ON user_consents(updated_at DESC);

-- Composite index for active consents
CREATE INDEX idx_user_consents_active ON user_consents(user_address, consent_type, granted) WHERE granted = true;

COMMENT ON TABLE user_consents IS 'User consent records for GDPR Article 7 compliance. Tracks opt-in/opt-out for various data processing activities.';
COMMENT ON COLUMN user_consents.consent_version IS 'Version of consent text shown to user';
COMMENT ON COLUMN user_consents.granted IS 'Current consent status: true = granted, false = revoked';

-- ============================================================================
-- DATA DELETION REQUESTS TABLE
-- ============================================================================
-- Tracks GDPR "Right to be Forgotten" (Article 17) and CCPA deletion requests

CREATE TABLE IF NOT EXISTS data_deletion_requests (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_address VARCHAR(66) NOT NULL,
  sso_id VARCHAR(255),
  request_type VARCHAR(50) NOT NULL CHECK (request_type IN ('gdpr', 'ccpa', 'user_initiated')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  delete_blockchain_data BOOLEAN DEFAULT false,
  deletion_report JSONB,
  error_message TEXT,
  requested_by VARCHAR(255),
  processed_by VARCHAR(255),
  notes TEXT
);

-- Indexes for deletion request tracking
CREATE INDEX idx_deletion_user ON data_deletion_requests(user_address);
CREATE INDEX idx_deletion_status ON data_deletion_requests(status);
CREATE INDEX idx_deletion_requested_at ON data_deletion_requests(requested_at DESC);
CREATE INDEX idx_deletion_request_id ON data_deletion_requests(request_id);
CREATE INDEX idx_deletion_sso_id ON data_deletion_requests(sso_id) WHERE sso_id IS NOT NULL;

COMMENT ON TABLE data_deletion_requests IS 'Tracks GDPR Article 17 and CCPA deletion requests. Required for compliance audits.';
COMMENT ON COLUMN data_deletion_requests.delete_blockchain_data IS 'Note: Blockchain data cannot be deleted due to immutability. This flag indicates user preference.';
COMMENT ON COLUMN data_deletion_requests.deletion_report IS 'JSON report of what data was deleted from which tables';

-- ============================================================================
-- DATA EXPORT REQUESTS TABLE
-- ============================================================================
-- Tracks GDPR "Right to Data Portability" (Article 20) requests

CREATE TABLE IF NOT EXISTS data_export_requests (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  user_address VARCHAR(66) NOT NULL,
  sso_id VARCHAR(255),
  export_format VARCHAR(20) DEFAULT 'json' CHECK (export_format IN ('json', 'csv', 'xml')),
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired')),
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP,
  download_url TEXT,
  file_size_bytes BIGINT,
  file_hash VARCHAR(64),
  download_count INT DEFAULT 0,
  last_downloaded_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  error_message TEXT
);

-- Indexes for export request tracking
CREATE INDEX idx_export_user ON data_export_requests(user_address);
CREATE INDEX idx_export_status ON data_export_requests(status);
CREATE INDEX idx_export_requested_at ON data_export_requests(requested_at DESC);
CREATE INDEX idx_export_expires_at ON data_export_requests(expires_at) WHERE expires_at IS NOT NULL;

COMMENT ON TABLE data_export_requests IS 'Tracks GDPR Article 20 data portability requests. Exports expire after 30 days.';

-- ============================================================================
-- COMPLIANCE EVENTS TABLE
-- ============================================================================
-- High-level compliance milestone tracking

CREATE TABLE IF NOT EXISTS compliance_events (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  event_date TIMESTAMP NOT NULL DEFAULT NOW(),
  affected_users_count INT DEFAULT 0,
  description TEXT,
  compliance_officer VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_event_type ON compliance_events(event_type);
CREATE INDEX idx_compliance_event_date ON compliance_events(event_date DESC);

COMMENT ON TABLE compliance_events IS 'High-level compliance events: policy updates, breach notifications, audits, etc.';

-- ============================================================================
-- SECURITY ALERTS TABLE
-- ============================================================================
-- Automated security monitoring alerts

CREATE TABLE IF NOT EXISTS security_alerts (
  id BIGSERIAL PRIMARY KEY,
  alert_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  alert_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_address VARCHAR(66),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive')),
  triggered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  resolution_notes TEXT
);

CREATE INDEX idx_security_alert_user ON security_alerts(user_address) WHERE user_address IS NOT NULL;
CREATE INDEX idx_security_alert_type ON security_alerts(alert_type);
CREATE INDEX idx_security_alert_severity ON security_alerts(severity);
CREATE INDEX idx_security_alert_status ON security_alerts(status);
CREATE INDEX idx_security_alert_triggered_at ON security_alerts(triggered_at DESC);

COMMENT ON TABLE security_alerts IS 'Automated security monitoring alerts for suspicious activity detection.';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_consents_updated_at
  BEFORE UPDATE ON user_consents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert initial compliance event
INSERT INTO compliance_events (event_type, description, compliance_officer)
VALUES ('system_initialization', 'Audit logging and compliance system initialized', 'system');

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (Run this to undo the migration)
-- ============================================================================
/*
BEGIN;
DROP TRIGGER IF EXISTS update_user_consents_updated_at ON user_consents;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP TABLE IF EXISTS security_alerts CASCADE;
DROP TABLE IF EXISTS compliance_events CASCADE;
DROP TABLE IF EXISTS data_export_requests CASCADE;
DROP TABLE IF EXISTS data_deletion_requests CASCADE;
DROP TABLE IF EXISTS user_consents CASCADE;
DROP TABLE IF EXISTS wallet_audit_logs CASCADE;
COMMIT;
*/
