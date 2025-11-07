-- Migration: Add authentication and session tables
-- Created: 2025-11-07
-- Description: Adds tables for user sessions, login nonces, and refresh tokens

-- =====================================================
-- USER SESSIONS (Optional - for session tracking)
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    address VARCHAR(66) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(128) NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_address ON user_sessions(address);
CREATE INDEX idx_sessions_token_hash ON user_sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- =====================================================
-- LOGIN ATTEMPTS (for security monitoring)
-- =====================================================

CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    address VARCHAR(66) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    user_agent TEXT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_attempts_address ON login_attempts(address);
CREATE INDEX idx_login_attempts_created ON login_attempts(created_at DESC);

-- =====================================================
-- BLACKLISTED TOKENS (for token revocation)
-- =====================================================

CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    address VARCHAR(66) NOT NULL REFERENCES users(address) ON DELETE CASCADE,
    reason VARCHAR(255),
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blacklisted_tokens_hash ON blacklisted_tokens(token_hash);
CREATE INDEX idx_blacklisted_tokens_expires ON blacklisted_tokens(expires_at);

-- =====================================================
-- CLEANUP FUNCTION (remove expired sessions/tokens)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
    -- Delete expired sessions
    DELETE FROM user_sessions WHERE expires_at < NOW();

    -- Delete expired blacklisted tokens
    DELETE FROM blacklisted_tokens WHERE expires_at < NOW();

    -- Delete old login attempts (older than 30 days)
    DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER TO UPDATE last_used_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_session_last_used()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This trigger would be applied when sessions are actually used
-- For now, commented out as we're using stateless JWT
-- CREATE TRIGGER update_session_last_used_trigger
-- BEFORE UPDATE ON user_sessions
-- FOR EACH ROW EXECUTE FUNCTION update_session_last_used();

-- =====================================================
-- NOTES
-- =====================================================

-- user_sessions table:
-- - Used for tracking active sessions (optional with JWT)
-- - refresh_token_hash: SHA-256 hash of refresh token for lookup
-- - Can be used for session revocation and monitoring

-- login_attempts table:
-- - Tracks all login attempts for security monitoring
-- - Helps identify brute force attacks
-- - Records both successful and failed attempts

-- blacklisted_tokens table:
-- - Allows token revocation before expiration
-- - token_hash: SHA-256 hash of the JWT token
-- - Used for logout, password reset, or security incidents

-- Cleanup:
-- Run cleanup_expired_auth_data() periodically via cron job
-- Example: SELECT cleanup_expired_auth_data();
