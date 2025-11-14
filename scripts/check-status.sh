#!/bin/bash

# Check Status Script
# Verifies all services are running correctly

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NYU Aptos Builder Camp - Service Status Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check PostgreSQL
echo "PostgreSQL:"
if command_exists docker && docker ps | grep -q "nyu-aptos-db"; then
    print_success "Running (Docker container)"
    docker exec nyu-aptos-db pg_isready -U postgres >/dev/null 2>&1 && print_success "  Database is accepting connections"
elif command_exists pg_isready && pg_isready >/dev/null 2>&1; then
    print_success "Running (local)"
else
    print_error "Not running"
fi

echo ""

# Check Backend
echo "Backend (Port 3001):"
if lsof -ti:3001 >/dev/null 2>&1; then
    print_success "Process running on port 3001"

    # Check health endpoint
    if command_exists curl; then
        HEALTH_CHECK=$(curl -s http://localhost:3001/health 2>/dev/null)
        if [ $? -eq 0 ]; then
            print_success "  Health check: PASS"
            echo "$HEALTH_CHECK" | grep -q '"status":"ok"' && print_success "  Status: OK"
        else
            print_error "  Health check: FAIL"
        fi
    fi
else
    print_error "No process on port 3001"
fi

echo ""

# Check Frontend
echo "Frontend (Port 3000):"
if lsof -ti:3000 >/dev/null 2>&1; then
    print_success "Process running on port 3000"

    if command_exists curl; then
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
        if [ "$HTTP_CODE" == "200" ]; then
            print_success "  HTTP Response: $HTTP_CODE"
        else
            print_error "  HTTP Response: $HTTP_CODE"
        fi
    fi
else
    print_error "No process on port 3000"
fi

echo ""

# Check environment files
echo "Configuration Files:"
[ -f "backend/.env" ] && print_success "backend/.env exists" || print_error "backend/.env missing"
[ -f "frontend/.env.local" ] && print_success "frontend/.env.local exists" || print_error "frontend/.env.local missing"

echo ""

# Check dependencies
echo "Dependencies:"
[ -d "backend/node_modules" ] && print_success "Backend dependencies installed" || print_error "Backend dependencies missing"
[ -d "frontend/node_modules" ] && print_success "Frontend dependencies installed" || print_error "Frontend dependencies missing"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Quick access URLs
echo "Quick Access:"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  Health:    http://localhost:3001/health"
echo ""
