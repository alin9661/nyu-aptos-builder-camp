#!/bin/bash

# Docker Stop Script for NYU Aptos Backend
# Usage: ./scripts/docker-stop.sh [environment] [options]
# Examples:
#   ./scripts/docker-stop.sh dev
#   ./scripts/docker-stop.sh prod --remove-volumes
#   ./scripts/docker-stop.sh dev --clean

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
REMOVE_VOLUMES=""
REMOVE_IMAGES=""
CLEAN_ALL=false

# Parse additional arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--remove-volumes)
            REMOVE_VOLUMES="-v"
            shift
            ;;
        --remove-images)
            REMOVE_IMAGES="--rmi all"
            shift
            ;;
        --clean)
            CLEAN_ALL=true
            REMOVE_VOLUMES="-v"
            REMOVE_IMAGES="--rmi local"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Usage: $0 [dev|prod] [options]"
            echo "Options:"
            echo "  -v, --remove-volumes    Remove named volumes"
            echo "  --remove-images         Remove all images used by services"
            echo "  --clean                 Full cleanup (volumes + local images)"
            exit 1
            ;;
    esac
done

# Determine compose files based on environment
case $ENVIRONMENT in
    dev|development)
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.dev.yml"
        ;;
    prod|production)
        COMPOSE_FILES="-f docker-compose.yml -f docker-compose.prod.yml"
        ;;
    *)
        echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
        echo "Usage: $0 [dev|prod] [options]"
        exit 1
        ;;
esac

echo -e "${YELLOW}Stopping NYU Aptos Backend (${ENVIRONMENT} environment)${NC}"

# Show running containers before stopping
echo -e "\n${BLUE}Currently running containers:${NC}"
docker-compose ${COMPOSE_FILES} ps

# Stop and remove containers
echo -e "\n${YELLOW}Stopping containers...${NC}"
STOP_CMD="docker-compose ${COMPOSE_FILES} down ${REMOVE_VOLUMES} ${REMOVE_IMAGES}"

echo -e "${YELLOW}Executing: ${STOP_CMD}${NC}\n"
eval $STOP_CMD

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Services stopped successfully!${NC}"

    # Additional cleanup if requested
    if [ "$CLEAN_ALL" = true ]; then
        echo -e "\n${YELLOW}Performing additional cleanup...${NC}"

        # Remove dangling images
        echo -e "${BLUE}Removing dangling images...${NC}"
        docker image prune -f

        # Remove dangling volumes
        echo -e "${BLUE}Removing dangling volumes...${NC}"
        docker volume prune -f

        # Remove build cache (optional, uncomment if needed)
        # echo -e "${BLUE}Removing build cache...${NC}"
        # docker builder prune -f

        echo -e "${GREEN}Cleanup complete!${NC}"
    fi

    # Display summary
    echo -e "\n${GREEN}=== Summary ===${NC}"
    if [ -n "$REMOVE_VOLUMES" ]; then
        echo -e "${YELLOW}Volumes removed:${NC} Yes"
        echo -e "${RED}Warning: Database data has been deleted!${NC}"
    else
        echo -e "${YELLOW}Volumes removed:${NC} No (data persisted)"
    fi

    if [ -n "$REMOVE_IMAGES" ]; then
        echo -e "${YELLOW}Images removed:${NC} Yes"
    else
        echo -e "${YELLOW}Images removed:${NC} No"
    fi

    # Show remaining resources
    echo -e "\n${BLUE}Remaining Docker resources:${NC}"
    echo -e "${BLUE}Images:${NC}"
    docker images | grep nyu-aptos || echo "  No NYU Aptos images found"

    echo -e "\n${BLUE}Volumes:${NC}"
    docker volume ls | grep -E "nyu|aptos|postgres|redis|ipfs" || echo "  No related volumes found"

    echo -e "\n${GREEN}=== Next Steps ===${NC}"
    echo -e "To start services again:"
    echo -e "  ${YELLOW}./scripts/docker-run.sh ${ENVIRONMENT}${NC}"

    if [ -n "$REMOVE_VOLUMES" ]; then
        echo -e "\n${RED}Note: Database was removed. You'll need to re-initialize it.${NC}"
    fi

else
    echo -e "\n${RED}Failed to stop services!${NC}"
    exit 1
fi
