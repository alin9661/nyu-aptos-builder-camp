#!/bin/bash

# NYU Aptos Backend - Development Environment Setup Script
# This script sets up the complete development environment including PostgreSQL database

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
echo "  NYU Aptos - Development Setup"
echo "=============================================="
echo ""

# Load environment variables from .env if it exists
if [ -f ".env" ]; then
    print_info "Loading configuration from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
    print_success "Environment variables loaded"
else
    print_warning ".env file not found, using defaults"
fi

# Database configuration with defaults
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-nyu_aptos}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_TEST_NAME=${DB_TEST_NAME:-nyu_aptos_test}

export PGPASSWORD=$DB_PASSWORD

echo ""
print_info "Database Configuration:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Test DB: $DB_TEST_NAME"
echo ""

# Step 1: Check if PostgreSQL is installed
print_info "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed!"
    echo ""
    echo "Installation instructions:"
    echo ""
    echo "macOS (using Homebrew):"
    echo "  brew install postgresql@15"
    echo "  brew services start postgresql@15"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo apt update"
    echo "  sudo apt install postgresql postgresql-contrib"
    echo "  sudo systemctl start postgresql"
    echo ""
    echo "For other systems, visit: https://www.postgresql.org/download/"
    exit 1
fi

PSQL_VERSION=$(psql --version | awk '{print $3}')
print_success "PostgreSQL $PSQL_VERSION is installed"

# Step 2: Check if PostgreSQL is running
print_info "Checking if PostgreSQL is running..."
if ! pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    print_error "PostgreSQL is not running!"
    echo ""
    echo "To start PostgreSQL:"
    echo ""
    echo "macOS (Homebrew):"
    echo "  brew services start postgresql@15"
    echo ""
    echo "Ubuntu/Debian:"
    echo "  sudo systemctl start postgresql"
    echo "  sudo systemctl enable postgresql"
    echo ""
    echo "macOS/Linux (manual):"
    echo "  pg_ctl -D /usr/local/var/postgres start"
    exit 1
fi

print_success "PostgreSQL is running"

# Step 3: Test database connection
print_info "Testing database connection..."
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c '\q' 2>/dev/null; then
    print_error "Cannot connect to PostgreSQL!"
    echo ""
    echo "Common issues:"
    echo "1. Wrong password - check DB_PASSWORD in .env"
    echo "2. User doesn't exist - create user with:"
    echo "   createuser -s $DB_USER"
    echo "3. Permission denied - check pg_hba.conf"
    exit 1
fi

print_success "Database connection successful"

# Step 4: Check if main database exists
print_info "Checking if database '$DB_NAME' exists..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "Database '$DB_NAME' already exists"
    echo ""
    read -p "Do you want to recreate it? This will DELETE all data! (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Dropping database '$DB_NAME'..."
        dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        print_success "Database dropped"

        print_info "Creating database '$DB_NAME'..."
        createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        print_success "Database created"
    else
        print_info "Skipping database recreation"
    fi
else
    print_info "Creating database '$DB_NAME'..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    print_success "Database created"
fi

# Step 5: Run schema.sql
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

# Step 6: Create test database
echo ""
print_info "Setting up test database '$DB_TEST_NAME'..."

if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_TEST_NAME; then
    print_warning "Test database already exists"
else
    print_info "Creating test database '$DB_TEST_NAME'..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_TEST_NAME
    print_success "Test database created"
fi

print_info "Running schema on test database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_TEST_NAME -f database/schema.sql > /dev/null 2>&1
print_success "Test database schema initialized"

# Step 7: Display completion message
echo ""
echo "=============================================="
print_success "Development environment setup complete!"
echo "=============================================="
echo ""
echo "Database Details:"
echo "  Main DB:  $DB_NAME"
echo "  Test DB:  $DB_TEST_NAME"
echo "  Host:     $DB_HOST:$DB_PORT"
echo "  User:     $DB_USER"
echo ""
echo "Next Steps:"
echo ""
echo "1. Install Node.js dependencies:"
echo "   npm install"
echo ""
echo "2. (Optional) Seed test data:"
echo "   ./scripts/seed-db.sh"
echo ""
echo "3. Start the development server:"
echo "   npm run dev"
echo ""
echo "Useful Commands:"
echo "  - Connect to database:    psql -h $DB_HOST -U $DB_USER $DB_NAME"
echo "  - Reset database:         ./scripts/init-db.sh"
echo "  - Seed test data:         ./scripts/seed-db.sh"
echo "  - Run tests:              npm test"
echo ""
echo "=============================================="
echo ""

# Cleanup
unset PGPASSWORD
