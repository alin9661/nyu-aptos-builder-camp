-- Initialize NYU Aptos Database Schema
-- This script runs automatically when PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables for proposals
CREATE TABLE IF NOT EXISTS proposals (
  id BIGSERIAL PRIMARY KEY,
  proposal_id BIGINT UNIQUE NOT NULL,
  proposer VARCHAR(66) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  ipfs_hash VARCHAR(100),
  proposal_type VARCHAR(50) NOT NULL,
  voting_start_time BIGINT NOT NULL,
  voting_end_time BIGINT NOT NULL,
  quorum_required BIGINT NOT NULL,
  votes_for BIGINT DEFAULT 0,
  votes_against BIGINT DEFAULT 0,
  votes_abstain BIGINT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  executed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for proposals
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_proposer ON proposals(proposer);
CREATE INDEX IF NOT EXISTS idx_proposals_type ON proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_proposals_voting_end ON proposals(voting_end_time);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id BIGSERIAL PRIMARY KEY,
  proposal_id BIGINT NOT NULL,
  voter VARCHAR(66) NOT NULL,
  vote_type VARCHAR(20) NOT NULL,
  voting_power BIGINT NOT NULL,
  voted_at BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(proposal_id, voter),
  FOREIGN KEY (proposal_id) REFERENCES proposals(proposal_id) ON DELETE CASCADE
);

-- Create indexes for votes
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter);
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);

-- Create treasury transactions table
CREATE TABLE IF NOT EXISTS treasury_transactions (
  id BIGSERIAL PRIMARY KEY,
  version BIGINT UNIQUE NOT NULL,
  hash VARCHAR(66) NOT NULL,
  sender VARCHAR(66) NOT NULL,
  receiver VARCHAR(66),
  amount BIGINT NOT NULL,
  coin_type VARCHAR(255) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  timestamp BIGINT NOT NULL,
  success BOOLEAN NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for treasury transactions
CREATE INDEX IF NOT EXISTS idx_treasury_tx_sender ON treasury_transactions(sender);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_receiver ON treasury_transactions(receiver);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_type ON treasury_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_timestamp ON treasury_transactions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_hash ON treasury_transactions(hash);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_success ON treasury_transactions(success);

-- Create reimbursement requests table
CREATE TABLE IF NOT EXISTS reimbursement_requests (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT UNIQUE NOT NULL,
  requester VARCHAR(66) NOT NULL,
  amount BIGINT NOT NULL,
  reason TEXT,
  ipfs_hash VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  approved_by VARCHAR(66),
  approved_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for reimbursements
CREATE INDEX IF NOT EXISTS idx_reimbursement_status ON reimbursement_requests(status);
CREATE INDEX IF NOT EXISTS idx_reimbursement_requester ON reimbursement_requests(requester);
CREATE INDEX IF NOT EXISTS idx_reimbursement_created_at ON reimbursement_requests(created_at DESC);

-- Create governance elections table
CREATE TABLE IF NOT EXISTS elections (
  id BIGSERIAL PRIMARY KEY,
  election_id BIGINT NOT NULL,
  role VARCHAR(50) NOT NULL,
  start_time BIGINT NOT NULL,
  end_time BIGINT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  winner VARCHAR(66),
  total_votes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(election_id, role)
);

-- Create indexes for elections
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections(status);
CREATE INDEX IF NOT EXISTS idx_elections_role ON elections(role);
CREATE INDEX IF NOT EXISTS idx_elections_end_time ON elections(end_time DESC);

-- Create election candidates table
CREATE TABLE IF NOT EXISTS election_candidates (
  id BIGSERIAL PRIMARY KEY,
  election_id BIGINT NOT NULL,
  role VARCHAR(50) NOT NULL,
  candidate VARCHAR(66) NOT NULL,
  votes BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(election_id, role, candidate),
  FOREIGN KEY (election_id, role) REFERENCES elections(election_id, role) ON DELETE CASCADE
);

-- Create indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_election ON election_candidates(election_id, role);
CREATE INDEX IF NOT EXISTS idx_candidates_votes ON election_candidates(votes DESC);

-- Create governance members table
CREATE TABLE IF NOT EXISTS governance_members (
  id BIGSERIAL PRIMARY KEY,
  address VARCHAR(66) UNIQUE NOT NULL,
  role VARCHAR(50),
  voting_power BIGINT DEFAULT 0,
  joined_at BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for members
CREATE INDEX IF NOT EXISTS idx_members_role ON governance_members(role);
CREATE INDEX IF NOT EXISTS idx_members_voting_power ON governance_members(voting_power DESC);

-- Create indexer state table (for tracking sync progress)
CREATE TABLE IF NOT EXISTS indexer_state (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value BIGINT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial indexer state
INSERT INTO indexer_state (key, value)
VALUES ('last_processed_version', 0)
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reimbursements_updated_at ON reimbursement_requests;
CREATE TRIGGER update_reimbursements_updated_at
  BEFORE UPDATE ON reimbursement_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_elections_updated_at ON elections;
CREATE TRIGGER update_elections_updated_at
  BEFORE UPDATE ON elections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_members_updated_at ON governance_members;
CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON governance_members
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_indexer_state_updated_at ON indexer_state;
CREATE TRIGGER update_indexer_state_updated_at
  BEFORE UPDATE ON indexer_state
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create views for common queries
CREATE OR REPLACE VIEW active_proposals AS
SELECT
  p.*,
  COUNT(DISTINCT v.voter) as total_voters
FROM proposals p
LEFT JOIN votes v ON p.proposal_id = v.proposal_id
WHERE p.status = 'active'
  AND p.voting_end_time > EXTRACT(EPOCH FROM NOW())::BIGINT
GROUP BY p.id;

CREATE OR REPLACE VIEW proposal_stats AS
SELECT
  proposal_type,
  COUNT(*) as total_proposals,
  COUNT(*) FILTER (WHERE status = 'active') as active_proposals,
  COUNT(*) FILTER (WHERE status = 'passed') as passed_proposals,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_proposals,
  COUNT(*) FILTER (WHERE executed = true) as executed_proposals
FROM proposals
GROUP BY proposal_type;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Log initialization complete
DO $$
BEGIN
  RAISE NOTICE 'NYU Aptos Database initialized successfully';
END $$;
