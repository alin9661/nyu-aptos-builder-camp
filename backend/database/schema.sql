-- NYU Aptos Builder Camp - PostgreSQL Database Schema
-- Phase 2 Backend Infrastructure

-- =====================================================
-- USERS AND ROLES
-- =====================================================

CREATE TABLE IF NOT EXISTS users (
    address VARCHAR(66) PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'advisor', 'president', 'vice_president', 'eboard_member', 'member')),
    display_name VARCHAR(255),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_role ON users(role);

-- =====================================================
-- TREASURY TRANSACTIONS CACHE
-- =====================================================

CREATE TABLE IF NOT EXISTS treasury_deposits (
    id SERIAL PRIMARY KEY,
    source VARCHAR(20) NOT NULL CHECK (source IN ('SPONSOR', 'MERCH')),
    amount BIGINT NOT NULL,
    total_balance BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treasury_deposits_timestamp ON treasury_deposits(timestamp DESC);
CREATE INDEX idx_treasury_deposits_source ON treasury_deposits(source);

-- =====================================================
-- REIMBURSEMENT REQUESTS
-- =====================================================

CREATE TABLE IF NOT EXISTS reimbursement_requests (
    id BIGINT PRIMARY KEY,
    payer VARCHAR(66) NOT NULL REFERENCES users(address),
    payee VARCHAR(66) NOT NULL REFERENCES users(address),
    amount BIGINT NOT NULL,
    invoice_uri TEXT NOT NULL,
    invoice_hash VARCHAR(66) NOT NULL,
    created_ts BIGINT NOT NULL,
    approved_advisor BOOLEAN DEFAULT FALSE,
    approved_president BOOLEAN DEFAULT FALSE,
    approved_vice BOOLEAN DEFAULT FALSE,
    paid_out BOOLEAN DEFAULT FALSE,
    transaction_hash VARCHAR(66),
    version BIGINT,
    block_height BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reimbursement_payer ON reimbursement_requests(payer);
CREATE INDEX idx_reimbursement_payee ON reimbursement_requests(payee);
CREATE INDEX idx_reimbursement_status ON reimbursement_requests(paid_out);

-- =====================================================
-- REIMBURSEMENT APPROVALS
-- =====================================================

CREATE TABLE IF NOT EXISTS reimbursement_approvals (
    id SERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES reimbursement_requests(id),
    approver VARCHAR(66) NOT NULL REFERENCES users(address),
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADVISOR', 'PRESIDENT', 'VICE')),
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_approvals_request ON reimbursement_approvals(request_id);
CREATE INDEX idx_approvals_approver ON reimbursement_approvals(approver);
CREATE INDEX idx_approvals_timestamp ON reimbursement_approvals(timestamp DESC);

-- =====================================================
-- REIMBURSEMENT PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS reimbursement_payments (
    id SERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES reimbursement_requests(id) UNIQUE,
    payee VARCHAR(66) NOT NULL REFERENCES users(address),
    amount BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_request ON reimbursement_payments(request_id);
CREATE INDEX idx_payments_payee ON reimbursement_payments(payee);
CREATE INDEX idx_payments_timestamp ON reimbursement_payments(timestamp DESC);

-- =====================================================
-- ELECTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS elections (
    election_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    start_ts BIGINT NOT NULL,
    end_ts BIGINT NOT NULL,
    finalized BOOLEAN DEFAULT FALSE,
    winner VARCHAR(66) REFERENCES users(address),
    is_tie BOOLEAN DEFAULT FALSE,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (election_id, role_name)
);

CREATE INDEX idx_elections_role ON elections(role_name);
CREATE INDEX idx_elections_status ON elections(finalized);
CREATE INDEX idx_elections_timestamp ON elections(start_ts DESC);

-- =====================================================
-- ELECTION CANDIDATES
-- =====================================================

CREATE TABLE IF NOT EXISTS election_candidates (
    id SERIAL PRIMARY KEY,
    election_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    candidate VARCHAR(66) NOT NULL REFERENCES users(address),
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id, role_name) REFERENCES elections(election_id, role_name)
);

CREATE INDEX idx_candidates_election ON election_candidates(election_id, role_name);
CREATE INDEX idx_candidates_address ON election_candidates(candidate);

-- =====================================================
-- ELECTION VOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS election_votes (
    id SERIAL PRIMARY KEY,
    election_id BIGINT NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    voter VARCHAR(66) NOT NULL REFERENCES users(address),
    candidate VARCHAR(66) NOT NULL REFERENCES users(address),
    weight BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id, role_name) REFERENCES elections(election_id, role_name),
    UNIQUE (election_id, role_name, voter)
);

CREATE INDEX idx_votes_election ON election_votes(election_id, role_name);
CREATE INDEX idx_votes_voter ON election_votes(voter);
CREATE INDEX idx_votes_candidate ON election_votes(candidate);

-- =====================================================
-- PROPOSALS
-- =====================================================

CREATE TABLE IF NOT EXISTS proposals (
    proposal_id BIGINT PRIMARY KEY,
    creator VARCHAR(66) NOT NULL REFERENCES users(address),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    start_ts BIGINT NOT NULL,
    end_ts BIGINT NOT NULL,
    status SMALLINT NOT NULL CHECK (status IN (0, 1, 2, 3, 4)),
    yay_votes BIGINT DEFAULT 0,
    nay_votes BIGINT DEFAULT 0,
    finalized BOOLEAN DEFAULT FALSE,
    executed BOOLEAN DEFAULT FALSE,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proposals_creator ON proposals(creator);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_timestamp ON proposals(start_ts DESC);

-- =====================================================
-- PROPOSAL VOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS proposal_votes (
    id SERIAL PRIMARY KEY,
    proposal_id BIGINT NOT NULL REFERENCES proposals(proposal_id),
    voter VARCHAR(66) NOT NULL REFERENCES users(address),
    vote BOOLEAN NOT NULL,
    weight BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    version BIGINT NOT NULL,
    block_height BIGINT NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (proposal_id, voter)
);

CREATE INDEX idx_proposal_votes_proposal ON proposal_votes(proposal_id);
CREATE INDEX idx_proposal_votes_voter ON proposal_votes(voter);
CREATE INDEX idx_proposal_votes_timestamp ON proposal_votes(timestamp DESC);

-- =====================================================
-- IPFS INVOICE METADATA
-- =====================================================

CREATE TABLE IF NOT EXISTS invoice_metadata (
    id SERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES reimbursement_requests(id) UNIQUE,
    ipfs_hash VARCHAR(100) NOT NULL UNIQUE,
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    uploaded_at TIMESTAMP NOT NULL,
    verified_on_chain BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_invoice_ipfs ON invoice_metadata(ipfs_hash);
CREATE INDEX idx_invoice_request ON invoice_metadata(request_id);

-- =====================================================
-- ANALYTICS AGGREGATIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS daily_treasury_stats (
    stat_date DATE PRIMARY KEY,
    total_deposits BIGINT NOT NULL,
    sponsor_deposits BIGINT NOT NULL,
    merch_deposits BIGINT NOT NULL,
    total_reimbursements BIGINT NOT NULL,
    pending_reimbursements BIGINT NOT NULL,
    closing_balance BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monthly_treasury_stats (
    stat_month DATE PRIMARY KEY,
    total_deposits BIGINT NOT NULL,
    sponsor_deposits BIGINT NOT NULL,
    merch_deposits BIGINT NOT NULL,
    total_reimbursements BIGINT NOT NULL,
    pending_reimbursements BIGINT NOT NULL,
    avg_balance BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXER STATE TRACKING
-- =====================================================

CREATE TABLE IF NOT EXISTS indexer_state (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    last_processed_version BIGINT NOT NULL,
    last_processed_timestamp TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'stopped', 'error')),
    error_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reimbursement_requests_updated_at BEFORE UPDATE ON reimbursement_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_indexer_state_updated_at BEFORE UPDATE ON indexer_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert indexer service state trackers
INSERT INTO indexer_state (service_name, last_processed_version, last_processed_timestamp, status)
VALUES
    ('treasury_indexer', 0, CURRENT_TIMESTAMP, 'stopped'),
    ('governance_indexer', 0, CURRENT_TIMESTAMP, 'stopped'),
    ('proposals_indexer', 0, CURRENT_TIMESTAMP, 'stopped')
ON CONFLICT (service_name) DO NOTHING;
