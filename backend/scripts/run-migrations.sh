#!/bin/bash

# Migration Runner Script for NYU Aptos Builder Camp Backend
# This script runs database migrations in order

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-nyu_aptos}
DB_USER=${DB_USER:-postgres}

echo -e "${GREEN}NYU Aptos Builder Camp - Database Migration Runner${NC}"
echo "=================================================="
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}Error: psql command not found. Please install PostgreSQL client.${NC}"
    exit 1
fi

# Check database connection
echo -e "${YELLOW}Checking database connection...${NC}"
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c '\q' 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to database.${NC}"
    echo "Please check your database credentials in .env file"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"
echo ""

# Function to run a migration
run_migration() {
    local migration_file=$1
    local migration_name=$(basename $migration_file .sql)

    echo -e "${YELLOW}Running migration: $migration_name${NC}"

    if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migration_file > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Migration successful: $migration_name${NC}"
        return 0
    else
        echo -e "${RED}✗ Migration failed: $migration_name${NC}"
        return 1
    fi
}

# Run base schema if requested
if [ "$1" == "--with-schema" ] || [ "$1" == "-s" ]; then
    echo -e "${YELLOW}Running base schema...${NC}"
    if [ -f "database/schema.sql" ]; then
        if run_migration "database/schema.sql"; then
            echo ""
        else
            echo -e "${RED}Failed to run base schema${NC}"
            exit 1
        fi
    else
        echo -e "${RED}Error: database/schema.sql not found${NC}"
        exit 1
    fi
fi

# Run migrations
echo -e "${YELLOW}Running authentication migrations...${NC}"
echo ""

# Check if migrations directory exists
if [ ! -d "database/migrations" ]; then
    echo -e "${RED}Error: database/migrations directory not found${NC}"
    exit 1
fi

# Track migration status
MIGRATIONS_RUN=0
MIGRATIONS_FAILED=0

# Run each migration in order
for migration in database/migrations/*.sql; do
    if [ -f "$migration" ]; then
        if run_migration "$migration"; then
            ((MIGRATIONS_RUN++))
        else
            ((MIGRATIONS_FAILED++))
            echo -e "${RED}Error in migration: $migration${NC}"
            echo "Please fix the error and run again"
            exit 1
        fi
    fi
done

echo ""
echo "=================================================="
echo -e "${GREEN}Migration Summary${NC}"
echo "=================================================="
echo -e "Migrations run: ${GREEN}$MIGRATIONS_RUN${NC}"
echo -e "Migrations failed: $([ $MIGRATIONS_FAILED -eq 0 ] && echo -e "${GREEN}$MIGRATIONS_FAILED${NC}" || echo -e "${RED}$MIGRATIONS_FAILED${NC}")"
echo ""

if [ $MIGRATIONS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All migrations completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set up JWT secrets in .env file"
    echo "2. Run: npm run dev"
    echo "3. Test authentication: curl http://localhost:3001/api/auth/nonce"
    exit 0
else
    echo -e "${RED}✗ Some migrations failed${NC}"
    exit 1
fi
