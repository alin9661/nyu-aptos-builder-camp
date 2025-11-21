#!/bin/bash

# Start Development Environment Script
# Starts all services for local development

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_header "Starting NYU Aptos Builder Camp Development Environment"

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_error "backend/.env not found"
    echo "Please run ./scripts/setup.sh first"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    print_error "frontend/.env.local not found"
    echo "Please run ./scripts/setup.sh first"
    exit 1
fi

# Check if PostgreSQL is running
print_info "Checking PostgreSQL status..."

if command_exists docker && docker ps | grep -q "nyu-aptos-db"; then
    print_success "PostgreSQL (Docker) is running"
elif command_exists docker; then
    print_warning "PostgreSQL container not running. Starting it now..."
    cd backend
    docker-compose up -d postgres
    print_info "Waiting for PostgreSQL to be ready..."
    sleep 5
    print_success "PostgreSQL started"
    cd ..
else
    # Check if local PostgreSQL is running
    if pg_isready >/dev/null 2>&1; then
        print_success "PostgreSQL (local) is running"
    else
        print_warning "PostgreSQL doesn't appear to be running"
        echo "Please start PostgreSQL manually"
    fi
fi

# Display instructions
print_header "Development Servers"

echo ""
echo "To start the application, open 3 terminal windows and run:"
echo ""
echo -e "${BLUE}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
echo "  cd frontend"
echo "  pnpm dev"
echo ""
echo -e "${BLUE}Terminal 3 - PostgreSQL logs (optional):${NC}"
echo "  docker logs -f nyu-aptos-db"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ask if user wants to start services automatically
read -p "Would you like to start backend and frontend now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Starting services..."

    # Check OS for terminal command
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        print_info "Opening new terminal tabs..."

        # Start backend in new tab
        osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/backend && npm run dev"' &

        # Start frontend in new tab
        osascript -e 'tell application "Terminal" to do script "cd '$(pwd)'/frontend && pnpm dev"' &

        print_success "Services started in new terminal tabs"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists gnome-terminal; then
            gnome-terminal --tab --title="Backend" -- bash -c "cd $(pwd)/backend && npm run dev; exec bash" &
            gnome-terminal --tab --title="Frontend" -- bash -c "cd $(pwd)/frontend && pnpm dev; exec bash" &
            print_success "Services started in new terminal tabs"
        else
            print_warning "Please start the services manually in separate terminals"
        fi
    else
        print_warning "Unable to automatically open terminals on this OS"
        print_info "Please run the commands above in separate terminals"
    fi

    sleep 2

    print_header "Application Access"
    echo ""
    echo "Once services are running, access the application at:"
    echo ""
    echo "  Frontend:  http://localhost:3000"
    echo "  Backend:   http://localhost:3001"
    echo "  Health:    http://localhost:3001/health"
    echo ""

else
    print_info "Please start the services manually as shown above"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}To stop all services:${NC}"
echo "  1. Press Ctrl+C in each terminal"
echo "  2. Stop Docker: cd backend && docker-compose down"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
