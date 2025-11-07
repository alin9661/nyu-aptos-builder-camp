#!/bin/bash

# NYU Aptos Backend - Database Seeding Script
# This script populates the database with realistic test data

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Banner
echo ""
echo "=============================================="
echo "  NYU Aptos - Database Seeding"
echo "=============================================="
echo ""

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    print_info "Loading configuration from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    print_warning ".env file not found, using defaults"
fi

# Database configuration with defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-nyu_aptos}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}

export PGPASSWORD=$DB_PASSWORD

echo ""
print_info "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Check PostgreSQL connection
print_info "Checking database connection..."
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    print_error "Cannot connect to database '$DB_NAME'"
    echo "Run './scripts/setup-dev.sh' first to create the database"
    exit 1
fi

print_success "Connected to database"

# Create seed data SQL
print_info "Preparing seed data..."

SEED_SQL=$(cat <<'EOF'
-- =====================================================
-- SEED DATA FOR DEVELOPMENT AND TESTING
-- =====================================================

-- Clear existing data (in correct order due to foreign keys)
DELETE FROM proposal_votes;
DELETE FROM proposals;
DELETE FROM election_votes;
DELETE FROM election_candidates;
DELETE FROM elections;
DELETE FROM invoice_metadata;
DELETE FROM reimbursement_payments;
DELETE FROM reimbursement_approvals;
DELETE FROM reimbursement_requests;
DELETE FROM treasury_deposits;
DELETE FROM daily_treasury_stats;
DELETE FROM monthly_treasury_stats;
DELETE FROM users;

-- =====================================================
-- USERS
-- =====================================================

INSERT INTO users (address, role, display_name, email) VALUES
-- Leadership
('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'advisor', 'Dr. Sarah Chen', 'sarah.chen@nyu.edu'),
('0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef', 'president', 'Alex Rodriguez', 'alex.rodriguez@nyu.edu'),
('0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef', 'vice_president', 'Jamie Lee', 'jamie.lee@nyu.edu'),

-- E-board Members
('0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef', 'eboard_member', 'Marcus Johnson', 'marcus.johnson@nyu.edu'),
('0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef', 'eboard_member', 'Priya Patel', 'priya.patel@nyu.edu'),
('0x6789012345abcdef6789012345abcdef6789012345abcdef6789012345abcdef', 'eboard_member', 'David Kim', 'david.kim@nyu.edu'),
('0x7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef', 'eboard_member', 'Emma Martinez', 'emma.martinez@nyu.edu'),

-- Regular Members
('0x8901234567abcdef8901234567abcdef8901234567abcdef8901234567abcdef', 'member', 'Chris Wong', 'chris.wong@nyu.edu'),
('0x9012345678abcdef9012345678abcdef9012345678abcdef9012345678abcdef', 'member', 'Sophie Anderson', 'sophie.anderson@nyu.edu'),
('0xa123456789abcdefa123456789abcdefa123456789abcdefa123456789abcdef', 'member', 'Ryan Taylor', 'ryan.taylor@nyu.edu'),
('0xb234567890abcdefb234567890abcdefb234567890abcdefb234567890abcdef', 'member', 'Olivia Brown', 'olivia.brown@nyu.edu'),
('0xc345678901abcdefc345678901abcdefc345678901abcdefc345678901abcdef', 'member', 'Nathan Garcia', 'nathan.garcia@nyu.edu');

-- =====================================================
-- TREASURY DEPOSITS
-- =====================================================

INSERT INTO treasury_deposits (source, amount, total_balance, transaction_hash, version, block_height, timestamp) VALUES
-- Sponsor deposits
('SPONSOR', 500000000000, 500000000000, '0xdeadbeef01', 1001, 10001, NOW() - INTERVAL '90 days'),
('SPONSOR', 300000000000, 800000000000, '0xdeadbeef02', 1050, 10050, NOW() - INTERVAL '75 days'),
('SPONSOR', 750000000000, 1550000000000, '0xdeadbeef03', 1120, 10120, NOW() - INTERVAL '60 days'),
('SPONSOR', 400000000000, 1950000000000, '0xdeadbeef04', 1200, 10200, NOW() - INTERVAL '45 days'),

-- Merchandise sales
('MERCH', 50000000000, 2000000000000, '0xdeadbeef05', 1250, 10250, NOW() - INTERVAL '40 days'),
('MERCH', 75000000000, 2075000000000, '0xdeadbeef06', 1300, 10300, NOW() - INTERVAL '30 days'),
('MERCH', 60000000000, 2135000000000, '0xdeadbeef07', 1350, 10350, NOW() - INTERVAL '20 days'),
('MERCH', 45000000000, 2180000000000, '0xdeadbeef08', 1400, 10400, NOW() - INTERVAL '10 days'),

-- Recent deposits
('SPONSOR', 250000000000, 2430000000000, '0xdeadbeef09', 1450, 10450, NOW() - INTERVAL '5 days'),
('MERCH', 30000000000, 2460000000000, '0xdeadbeef10', 1500, 10500, NOW() - INTERVAL '2 days');

-- =====================================================
-- REIMBURSEMENT REQUESTS
-- =====================================================

-- Paid out reimbursement (Marcus Johnson for workshop supplies)
INSERT INTO reimbursement_requests (
    id, payer, payee, amount, invoice_uri, invoice_hash, created_ts,
    approved_advisor, approved_president, approved_vice, paid_out,
    transaction_hash, version, block_height
) VALUES (
    1,
    '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef',
    '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef',
    15000000000,
    'ipfs://QmX7YvZ1234567890workshop',
    '0xhash001',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '60 days'))::BIGINT,
    true, true, true, true,
    '0xpayout001', 2001, 20001
);

-- Fully approved, pending payout (Priya Patel for event catering)
INSERT INTO reimbursement_requests (
    id, payer, payee, amount, invoice_uri, invoice_hash, created_ts,
    approved_advisor, approved_president, approved_vice, paid_out
) VALUES (
    2,
    '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
    '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
    25000000000,
    'ipfs://QmX7YvZ1234567890catering',
    '0xhash002',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '15 days'))::BIGINT,
    true, true, true, false
);

-- Partially approved (David Kim for marketing materials)
INSERT INTO reimbursement_requests (
    id, payer, payee, amount, invoice_uri, invoice_hash, created_ts,
    approved_advisor, approved_president, approved_vice, paid_out
) VALUES (
    3,
    '0x6789012345abcdef6789012345abcdef6789012345abcdef6789012345abcdef',
    '0x6789012345abcdef6789012345abcdef6789012345abcdef6789012345abcdef',
    8000000000,
    'ipfs://QmX7YvZ1234567890marketing',
    '0xhash003',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '10 days'))::BIGINT,
    true, true, false, false
);

-- Newly submitted (Emma Martinez for hackathon prizes)
INSERT INTO reimbursement_requests (
    id, payer, payee, amount, invoice_uri, invoice_hash, created_ts,
    approved_advisor, approved_president, approved_vice, paid_out
) VALUES (
    4,
    '0x7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
    '0x7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
    50000000000,
    'ipfs://QmX7YvZ1234567890prizes',
    '0xhash004',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '3 days'))::BIGINT,
    false, false, false, false
);

-- Another pending request (Chris Wong for venue rental)
INSERT INTO reimbursement_requests (
    id, payer, payee, amount, invoice_uri, invoice_hash, created_ts,
    approved_advisor, approved_president, approved_vice, paid_out
) VALUES (
    5,
    '0x8901234567abcdef8901234567abcdef8901234567abcdef8901234567abcdef',
    '0x8901234567abcdef8901234567abcdef8901234567abcdef8901234567abcdef',
    35000000000,
    'ipfs://QmX7YvZ1234567890venue',
    '0xhash005',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT,
    true, false, false, false
);

-- =====================================================
-- REIMBURSEMENT APPROVALS
-- =====================================================

-- Approvals for request #1 (fully approved and paid)
INSERT INTO reimbursement_approvals (request_id, approver, role, transaction_hash, version, block_height, timestamp) VALUES
(1, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'ADVISOR', '0xapproval001', 1601, 16001, NOW() - INTERVAL '58 days'),
(1, '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef', 'PRESIDENT', '0xapproval002', 1650, 16002, NOW() - INTERVAL '57 days'),
(1, '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef', 'VICE', '0xapproval003', 1700, 16003, NOW() - INTERVAL '56 days');

-- Approvals for request #2 (fully approved, pending payout)
INSERT INTO reimbursement_approvals (request_id, approver, role, transaction_hash, version, block_height, timestamp) VALUES
(2, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'ADVISOR', '0xapproval004', 1750, 16004, NOW() - INTERVAL '14 days'),
(2, '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef', 'PRESIDENT', '0xapproval005', 1800, 16005, NOW() - INTERVAL '13 days'),
(2, '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef', 'VICE', '0xapproval006', 1850, 16006, NOW() - INTERVAL '12 days');

-- Approvals for request #3 (partially approved)
INSERT INTO reimbursement_approvals (request_id, approver, role, transaction_hash, version, block_height, timestamp) VALUES
(3, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'ADVISOR', '0xapproval007', 1900, 16007, NOW() - INTERVAL '9 days'),
(3, '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef', 'PRESIDENT', '0xapproval008', 1950, 16008, NOW() - INTERVAL '8 days');

-- Approval for request #5 (advisor only)
INSERT INTO reimbursement_approvals (request_id, approver, role, transaction_hash, version, block_height, timestamp) VALUES
(5, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'ADVISOR', '0xapproval009', 2000, 16009, NOW() - INTERVAL '4 days');

-- =====================================================
-- REIMBURSEMENT PAYMENTS
-- =====================================================

INSERT INTO reimbursement_payments (request_id, payee, amount, transaction_hash, version, block_height, timestamp) VALUES
(1, '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef', 15000000000, '0xpayout001', 2001, 20001, NOW() - INTERVAL '55 days');

-- =====================================================
-- PROPOSALS
-- =====================================================

-- Active proposal for budget allocation
INSERT INTO proposals (
    proposal_id, creator, title, description, start_ts, end_ts,
    status, yay_votes, nay_votes, finalized, executed,
    transaction_hash, version, block_height
) VALUES (
    1,
    '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
    'Q1 2024 Budget Allocation',
    'Proposal to allocate funds for Q1 activities: 40% events, 30% workshops, 20% marketing, 10% operations',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '5 days'))::BIGINT,
    EXTRACT(EPOCH FROM (NOW() + INTERVAL '9 days'))::BIGINT,
    1, -- ACTIVE
    5, 2, false, false,
    '0xproposal001', 3001, 30001
);

-- Passed and executed proposal
INSERT INTO proposals (
    proposal_id, creator, title, description, start_ts, end_ts,
    status, yay_votes, nay_votes, finalized, executed,
    transaction_hash, version, block_height
) VALUES (
    2,
    '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
    'New Membership Tier System',
    'Implement a tiered membership system based on participation and contributions',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '30 days'))::BIGINT,
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '16 days'))::BIGINT,
    3, -- PASSED
    8, 1, true, true,
    '0xproposal002', 3050, 30050
);

-- Rejected proposal
INSERT INTO proposals (
    proposal_id, creator, title, description, start_ts, end_ts,
    status, yay_votes, nay_votes, finalized, executed,
    transaction_hash, version, block_height
) VALUES (
    3,
    '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef',
    'Weekly Meeting Time Change',
    'Change weekly meetings from Tuesday 6pm to Friday 5pm',
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '45 days'))::BIGINT,
    EXTRACT(EPOCH FROM (NOW() - INTERVAL '31 days'))::BIGINT,
    4, -- REJECTED
    2, 7, true, false,
    '0xproposal003', 3100, 30100
);

-- =====================================================
-- PROPOSAL VOTES
-- =====================================================

-- Votes for active proposal #1
INSERT INTO proposal_votes (proposal_id, voter, vote, weight, transaction_hash, version, block_height, timestamp) VALUES
(1, '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', true, 1, '0xvote001', 3200, 32001, NOW() - INTERVAL '4 days'),
(1, '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef', true, 1, '0xvote002', 3201, 32002, NOW() - INTERVAL '3 days'),
(1, '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef', true, 1, '0xvote003', 3202, 32003, NOW() - INTERVAL '3 days'),
(1, '0x6789012345abcdef6789012345abcdef6789012345abcdef6789012345abcdef', true, 1, '0xvote004', 3203, 32004, NOW() - INTERVAL '2 days'),
(1, '0x7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef', true, 1, '0xvote005', 3204, 32005, NOW() - INTERVAL '2 days'),
(1, '0x8901234567abcdef8901234567abcdef8901234567abcdef8901234567abcdef', false, 1, '0xvote006', 3205, 32006, NOW() - INTERVAL '1 day'),
(1, '0x9012345678abcdef9012345678abcdef9012345678abcdef9012345678abcdef', false, 1, '0xvote007', 3206, 32007, NOW() - INTERVAL '1 day');

-- =====================================================
-- ANALYTICS
-- =====================================================

-- Daily treasury stats (last 7 days)
INSERT INTO daily_treasury_stats (stat_date, total_deposits, sponsor_deposits, merch_deposits, total_reimbursements, pending_reimbursements, closing_balance) VALUES
(CURRENT_DATE - INTERVAL '7 days', 50000000000, 40000000000, 10000000000, 5000000000, 15000000000, 2000000000000),
(CURRENT_DATE - INTERVAL '6 days', 30000000000, 20000000000, 10000000000, 0, 15000000000, 2030000000000),
(CURRENT_DATE - INTERVAL '5 days', 250000000000, 250000000000, 0, 0, 15000000000, 2280000000000),
(CURRENT_DATE - INTERVAL '4 days', 0, 0, 0, 0, 15000000000, 2280000000000),
(CURRENT_DATE - INTERVAL '3 days', 0, 0, 0, 0, 90000000000, 2280000000000),
(CURRENT_DATE - INTERVAL '2 days', 30000000000, 0, 30000000000, 15000000000, 75000000000, 2295000000000),
(CURRENT_DATE - INTERVAL '1 day', 0, 0, 0, 0, 75000000000, 2295000000000);

EOF
)

# Execute seed data
print_info "Inserting seed data..."
echo "$SEED_SQL" | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > /dev/null 2>&1

if [ $? -eq 0 ]; then
    print_success "Seed data inserted successfully"
else
    print_error "Failed to insert seed data"
    exit 1
fi

# Get counts
USER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | xargs)
DEPOSIT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM treasury_deposits;" | xargs)
REQUEST_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM reimbursement_requests;" | xargs)
PROPOSAL_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM proposals;" | xargs)

# Display summary
echo ""
echo "=============================================="
print_success "Database seeding complete!"
echo "=============================================="
echo ""
echo "Data Summary:"
echo "  Users:                  $USER_COUNT"
echo "  Treasury Deposits:      $DEPOSIT_COUNT"
echo "  Reimbursement Requests: $REQUEST_COUNT"
echo "  Proposals:              $PROPOSAL_COUNT"
echo ""
echo "Test Users:"
echo "  Advisor:        Dr. Sarah Chen"
echo "  President:      Alex Rodriguez"
echo "  Vice President: Jamie Lee"
echo "  E-board:        Marcus, Priya, David, Emma"
echo "  Members:        Chris, Sophie, Ryan, Olivia, Nathan"
echo ""
echo "Sample Data Includes:"
echo "  - 10 treasury deposits (sponsors & merchandise)"
echo "  - 5 reimbursement requests (various approval states)"
echo "  - 3 proposals (active, passed, rejected)"
echo "  - Proposal votes and approvals"
echo "  - Daily analytics data"
echo ""
echo "Next Steps:"
echo "  Start the server: npm run dev"
echo ""
echo "=============================================="
echo ""

# Cleanup
unset PGPASSWORD
