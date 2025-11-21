#!/bin/bash

# Automated Setup Script for NYU Aptos Builder Camp
# This script automates the initial setup process

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  $1"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main setup
print_header "NYU Aptos Builder Camp - Automated Setup"

# Step 1: Check Prerequisites
print_header "Step 1: Checking Prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check pnpm
if command_exists pnpm; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm installed: $PNPM_VERSION"
else
    print_warning "pnpm is not installed. Installing now..."
    npm install -g pnpm
    print_success "pnpm installed successfully"
fi

# Check Docker
if command_exists docker; then
    print_success "Docker installed"
    USE_DOCKER=true
else
    print_warning "Docker not found. Will attempt to use local PostgreSQL."
    USE_DOCKER=false
fi

# Check PostgreSQL (if not using Docker)
if [ "$USE_DOCKER" = false ]; then
    if command_exists psql; then
        print_success "PostgreSQL client installed"
    else
        print_error "Neither Docker nor PostgreSQL is available"
        echo "Please install either Docker Desktop or PostgreSQL"
        exit 1
    fi
fi

# Step 2: Environment Setup
print_header "Step 2: Setting Up Environment Files"

# Backend .env
if [ ! -f "backend/.env" ]; then
    print_info "Creating backend/.env from template..."
    cp backend/.env.example backend/.env

    # Generate secrets
    print_info "Generating secure secrets..."
    JWT_SECRET=$(openssl rand -hex 32)
    SESSION_SECRET=$(openssl rand -hex 32)
    WALLET_SECRET=$(openssl rand -hex 32)

    # Update .env file with secrets
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your_jwt_secret_here_min_32_characters_recommended/$JWT_SECRET/" backend/.env
        sed -i '' "s/your_jwt_refresh_secret_here_min_32_characters_recommended/$JWT_SECRET/" backend/.env
        sed -i '' "s/your_session_secret_here_min_32_characters_recommended/$SESSION_SECRET/" backend/.env
        sed -i '' "s/your_wallet_encryption_secret_here_min_32_characters/$WALLET_SECRET/" backend/.env
    else
        # Linux
        sed -i "s/your_jwt_secret_here_min_32_characters_recommended/$JWT_SECRET/" backend/.env
        sed -i "s/your_jwt_refresh_secret_here_min_32_characters_recommended/$JWT_SECRET/" backend/.env
        sed -i "s/your_session_secret_here_min_32_characters_recommended/$SESSION_SECRET/" backend/.env
        sed -i "s/your_wallet_encryption_secret_here_min_32_characters/$WALLET_SECRET/" backend/.env
    fi

    print_success "Backend .env created with generated secrets"
else
    print_warning "backend/.env already exists, skipping..."
fi

# Frontend .env.local
if [ ! -f "frontend/.env.local" ]; then
    print_info "Creating frontend/.env.local from template..."
    cp frontend/.env.local.example frontend/.env.local
    print_success "Frontend .env.local created"
else
    print_warning "frontend/.env.local already exists, skipping..."
fi

# Step 3: Install Dependencies
print_header "Step 3: Installing Dependencies"

print_info "Installing backend dependencies..."
cd backend
npm install
print_success "Backend dependencies installed"

print_info "Installing frontend dependencies..."
cd ../frontend
pnpm install
print_success "Frontend dependencies installed"
cd ..

# Step 4: Database Setup
print_header "Step 4: Setting Up Database"

if [ "$USE_DOCKER" = true ]; then
    print_info "Starting PostgreSQL with Docker..."
    cd backend

    # Start PostgreSQL container
    docker-compose up -d postgres

    print_info "Waiting for PostgreSQL to be ready..."
    sleep 10

    # Check if container is healthy
    if docker ps | grep -q "nyu-aptos-db"; then
        print_success "PostgreSQL container is running"

        # Run migrations
        print_info "Running database migrations..."
        docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/001_add_auth_tables.sql 2>/dev/null || true
        docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/002_add_sso_support.sql 2>/dev/null || true
        docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/003_add_notifications.sql 2>/dev/null || true
        docker exec -i nyu-aptos-db psql -U postgres -d nyu_aptos < database/migrations/003_add_wallet_audit_logs.sql 2>/dev/null || true
        print_success "Database migrations completed"
    else
        print_error "Failed to start PostgreSQL container"
        exit 1
    fi
    cd ..
else
    print_info "Please ensure PostgreSQL is running and create the database:"
    echo ""
    echo "  createdb nyu_aptos"
    echo ""
    echo "Then run migrations manually:"
    echo "  cd backend"
    echo "  psql -d nyu_aptos -U postgres -f database/migrations/001_add_auth_tables.sql"
    echo "  psql -d nyu_aptos -U postgres -f database/migrations/002_add_sso_support.sql"
    echo "  psql -d nyu_aptos -U postgres -f database/migrations/003_add_notifications.sql"
    echo "  psql -d nyu_aptos -U postgres -f database/migrations/003_add_wallet_audit_logs.sql"
    echo ""
fi

# Final Steps
print_header "Setup Complete!"

print_success "Your NYU Aptos Builder Camp environment is ready!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Start the development servers:"
echo "   ./scripts/start-dev.sh"
echo ""
echo "   Or manually:"
echo "   Terminal 1: cd backend && npm run dev"
echo "   Terminal 2: cd frontend && pnpm dev"
echo ""
echo "2. Access the application:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  For detailed documentation, see SETUP.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
