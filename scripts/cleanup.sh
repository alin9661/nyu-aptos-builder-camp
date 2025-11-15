#!/bin/bash

# Cleanup Script for NYU Aptos Builder Camp
# Removes all running services, Docker containers, and temporary files

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

print_header "NYU Aptos Builder Camp - Cleanup"

echo ""
echo "This script will:"
echo "  1. Stop all running services"
echo "  2. Remove Docker containers and volumes"
echo "  3. Clean node_modules (optional)"
echo "  4. Remove .env files (optional)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled"
    exit 0
fi

# Step 1: Stop running processes
print_header "Step 1: Stopping Running Processes"

# Stop backend (port 3001)
if lsof -ti:3001 >/dev/null 2>&1; then
    print_info "Stopping backend process on port 3001..."
    kill $(lsof -ti:3001) 2>/dev/null || true
    print_success "Backend stopped"
else
    print_info "No backend process running"
fi

# Stop frontend (port 3000)
if lsof -ti:3000 >/dev/null 2>&1; then
    print_info "Stopping frontend process on port 3000..."
    kill $(lsof -ti:3000) 2>/dev/null || true
    print_success "Frontend stopped"
else
    print_info "No frontend process running"
fi

# Step 2: Stop and remove Docker containers
print_header "Step 2: Cleaning Up Docker"

if command_exists docker; then
    cd backend 2>/dev/null || true

    # Stop containers
    if docker-compose ps | grep -q "nyu-aptos"; then
        print_info "Stopping Docker containers..."
        docker-compose down
        print_success "Docker containers stopped"
    else
        print_info "No Docker containers running"
    fi

    # Ask about removing volumes
    echo ""
    read -p "Remove Docker volumes (will DELETE database data)? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Removing Docker volumes..."
        docker-compose down -v
        print_success "Docker volumes removed"
    else
        print_info "Docker volumes preserved"
    fi

    cd .. 2>/dev/null || true
else
    print_info "Docker not installed, skipping..."
fi

# Step 3: Clean node_modules
print_header "Step 3: Cleaning Dependencies"

echo ""
read -p "Remove node_modules folders? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -d "backend/node_modules" ]; then
        print_info "Removing backend/node_modules..."
        rm -rf backend/node_modules
        print_success "Backend node_modules removed"
    fi

    if [ -d "frontend/node_modules" ]; then
        print_info "Removing frontend/node_modules..."
        rm -rf frontend/node_modules
        print_success "Frontend node_modules removed"
    fi
else
    print_info "node_modules preserved"
fi

# Step 4: Clean build artifacts
print_header "Step 4: Cleaning Build Artifacts"

if [ -d "backend/dist" ]; then
    print_info "Removing backend/dist..."
    rm -rf backend/dist
    print_success "Backend build artifacts removed"
fi

if [ -d "frontend/.next" ]; then
    print_info "Removing frontend/.next..."
    rm -rf frontend/.next
    print_success "Frontend build artifacts removed"
fi

if [ -d "frontend/out" ]; then
    print_info "Removing frontend/out..."
    rm -rf frontend/out
    print_success "Frontend out directory removed"
fi

# Step 5: Clean environment files
print_header "Step 5: Environment Files"

echo ""
read -p "Remove .env files (CAUTION: will delete your secrets)? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "backend/.env" ]; then
        print_info "Removing backend/.env..."
        rm backend/.env
        print_success "backend/.env removed"
    fi

    if [ -f "frontend/.env.local" ]; then
        print_info "Removing frontend/.env.local..."
        rm frontend/.env.local
        print_success "frontend/.env.local removed"
    fi
else
    print_info ".env files preserved"
fi

# Step 6: Clean logs
print_header "Step 6: Cleaning Logs"

if [ -d "backend/logs" ]; then
    print_info "Removing backend/logs..."
    rm -rf backend/logs
    print_success "Backend logs removed"
fi

# Summary
print_header "Cleanup Complete!"

echo ""
echo "Summary:"
echo "  ✓ Processes stopped"
echo "  ✓ Docker containers cleaned"
echo "  ✓ Build artifacts removed"
echo ""
echo "To start fresh:"
echo "  1. Run: ./scripts/setup.sh"
echo "  2. Run: ./scripts/start-dev.sh"
echo ""
print_success "All cleanup operations completed successfully"
echo ""
