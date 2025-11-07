#!/bin/bash

# NYU Aptos Backend - Database Initialization Script
# This script drops and recreates the database with fresh schema

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
echo "  NYU Aptos - Database Initialization"
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

# Warning message
print_warning "WARNING: This will DELETE all data in the '$DB_NAME' database!"
echo ""
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Operation cancelled"
    exit 0
fi

# Check if PostgreSQL is running
print_info "Checking PostgreSQL connection..."
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    print_error "PostgreSQL is not running on $DB_HOST:$DB_PORT"
    exit 1
fi

# Test database connection
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    print_error "Cannot connect to PostgreSQL!"
    echo "Check your credentials in .env file"
    exit 1
fi

print_success "Connected to PostgreSQL"

# Check if database exists
DB_EXISTS=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    # Terminate existing connections
    print_info "Terminating existing connections to '$DB_NAME'..."
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c \
        "SELECT pg_terminate_backend(pg_stat_activity.pid)
         FROM pg_stat_activity
         WHERE pg_stat_activity.datname = '$DB_NAME'
         AND pid <> pg_backend_pid();" > /dev/null 2>&1

    # Drop database
    print_info "Dropping database '$DB_NAME'..."
    dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    print_success "Database dropped"
fi

# Create fresh database
print_info "Creating database '$DB_NAME'..."
createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
print_success "Database created"

# Run schema
print_info "Running database schema..."
if [ ! -f "database/schema.sql" ]; then
    print_error "Schema file not found: database/schema.sql"
    echo "Please ensure you're running this script from the backend/ directory"
    exit 1
fi

if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql > /dev/null 2>&1; then
    print_success "Database schema initialized"

    # Count tables
    TABLE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    print_success "Created $TABLE_COUNT tables"
else
    print_error "Failed to run schema.sql"
    exit 1
fi

# Verify indexer state
print_info "Verifying initial data..."
INDEXER_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM indexer_state;" | xargs)
print_success "Indexer services initialized: $INDEXER_COUNT"

# Display completion message
echo ""
echo "=============================================="
print_success "Database initialization complete!"
echo "=============================================="
echo ""
echo "Database: $DB_NAME"
echo "Tables created: $TABLE_COUNT"
echo "Indexer services: $INDEXER_COUNT"
echo ""
echo "Next Steps:"
echo "  1. Seed test data:  ./scripts/seed-db.sh"
echo "  2. Start server:    npm run dev"
echo ""
echo "=============================================="
echo ""

# Cleanup
unset PGPASSWORD
