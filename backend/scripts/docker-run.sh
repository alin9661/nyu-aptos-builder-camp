#!/bin/bash

# Docker Run Script for NYU Aptos Backend
# Usage: ./scripts/docker-run.sh [environment] [options]
# Examples:
#   ./scripts/docker-run.sh dev
#   ./scripts/docker-run.sh prod --detach
#   ./scripts/docker-run.sh dev --with-ipfs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
DETACH=""
BUILD_FLAG=""
PROFILES=""

# Parse additional arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--detach)
            DETACH="-d"
            shift
            ;;
        --build)
            BUILD_FLAG="--build"
            shift
            ;;
        --with-ipfs)
            PROFILES="--profile with-ipfs"
            shift
            ;;
        --with-redis)
            PROFILES="${PROFILES} --profile with-redis"
            shift
            ;;
        --with-monitoring)
            PROFILES="${PROFILES} --profile with-monitoring"
            shift
            ;;
        --with-nginx)
            PROFILES="${PROFILES} --profile with-nginx"
            shift
            ;;
        --with-mail)
            PROFILES="${PROFILES} --profile with-mail"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [dev|prod] [options]"
            echo "Options:"
            echo "  -d, --detach         Run in detached mode"
            echo "  --build              Build images before starting"
            echo "  --with-ipfs          Include IPFS service"
            echo "  --with-redis         Include Redis service"
            echo "  --with-monitoring    Include monitoring services"
            echo "  --with-nginx         Include Nginx reverse proxy"
            echo "  --with-mail          Include Mailhog (dev only)"
            exit 1
            ;;
    esac
done

# Determine compose files based on environment
case $ENVIRONMENT in
    dev|development)
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
        ENV_FILE=".env.development"
        ;;
    prod|production)
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
        ENV_FILE=".env.production"
        ;;
    *)
        echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
        echo "Usage: $0 [dev|prod] [options]"
        exit 1
        ;;
esac

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found${NC}"
    if [ -f ".env.example" ]; then
        echo -e "${BLUE}Creating .env from .env.example...${NC}"
        cp .env.example .env
        echo -e "${GREEN}.env file created. Please update it with your configuration.${NC}"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
fi

# Check if environment-specific file exists
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}Using environment file: ${ENV_FILE}${NC}"
    export ENV_FILE
fi

echo -e "${GREEN}Starting NYU Aptos Backend in ${ENVIRONMENT} mode${NC}"
echo -e "${YELLOW}Compose files: ${COMPOSE_FILES}${NC}"

# Build command
RUN_CMD="docker-compose ${COMPOSE_FILES} ${PROFILES} up ${BUILD_FLAG} ${DETACH}"

echo -e "${YELLOW}Executing: ${RUN_CMD}${NC}\n"

# Run docker-compose
eval $RUN_CMD

if [ $? -eq 0 ]; then
    if [ -n "$DETACH" ]; then
        echo -e "\n${GREEN}Services started successfully in detached mode!${NC}"

        # Display running containers
        echo -e "\n${GREEN}Running containers:${NC}"
        docker-compose ${COMPOSE_FILES} ps

        # Display useful information
        echo -e "\n${GREEN}=== Service URLs ===${NC}"
        echo -e "${BLUE}Backend API:${NC}      http://localhost:3001"
        echo -e "${BLUE}API Health:${NC}       http://localhost:3001/health"

        if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
            echo -e "${BLUE}PostgreSQL:${NC}       localhost:5432"
            echo -e "${BLUE}PgAdmin:${NC}          http://localhost:5050"

            if echo "$PROFILES" | grep -q "with-ipfs"; then
                echo -e "${BLUE}IPFS API:${NC}         http://localhost:5001"
                echo -e "${BLUE}IPFS Gateway:${NC}     http://localhost:8080"
            fi

            if echo "$PROFILES" | grep -q "with-redis"; then
                echo -e "${BLUE}Redis:${NC}            localhost:6379"
            fi

            if echo "$PROFILES" | grep -q "with-mail"; then
                echo -e "${BLUE}Mailhog:${NC}          http://localhost:8025"
            fi
        fi

        if echo "$PROFILES" | grep -q "with-monitoring"; then
            echo -e "${BLUE}Prometheus:${NC}       http://localhost:9090"
            echo -e "${BLUE}Grafana:${NC}          http://localhost:3000"
        fi

        echo -e "\n${GREEN}=== Useful Commands ===${NC}"
        echo -e "${YELLOW}View logs:${NC}         docker-compose ${COMPOSE_FILES} logs -f"
        echo -e "${YELLOW}View backend logs:${NC} docker-compose ${COMPOSE_FILES} logs -f backend"
        echo -e "${YELLOW}Stop services:${NC}     ./scripts/docker-stop.sh ${ENVIRONMENT}"
        echo -e "${YELLOW}Restart backend:${NC}   docker-compose ${COMPOSE_FILES} restart backend"

    else
        echo -e "\n${GREEN}Services are running. Press Ctrl+C to stop.${NC}"
    fi
else
    echo -e "\n${RED}Failed to start services!${NC}"
    exit 1
fi
