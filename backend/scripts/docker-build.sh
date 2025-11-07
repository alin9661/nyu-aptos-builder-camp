#!/bin/bash

# Docker Build Script for NYU Aptos Backend
# Usage: ./scripts/docker-build.sh [environment] [options]
# Examples:
#   ./scripts/docker-build.sh dev
#   ./scripts/docker-build.sh prod --no-cache
#   ./scripts/docker-build.sh prod --push

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-dev}
IMAGE_NAME="nyu-aptos-backend"
VERSION=$(node -p "require('./package.json').version" 2>/dev/null || echo "1.0.0")
REGISTRY=${DOCKER_REGISTRY:-""}
NO_CACHE=""
PUSH_IMAGE=false

# Parse additional arguments
shift || true
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --push)
            PUSH_IMAGE=true
            shift
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

# Determine build target and tags based on environment
case $ENVIRONMENT in
    dev|development)
        TARGET="development"
        TAGS=("${IMAGE_NAME}:dev" "${IMAGE_NAME}:latest-dev")
        ;;
    prod|production)
        TARGET="production"
        TAGS=("${IMAGE_NAME}:prod" "${IMAGE_NAME}:${VERSION}" "${IMAGE_NAME}:latest")
        ;;
    *)
        echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
        echo "Usage: $0 [dev|prod] [options]"
        exit 1
        ;;
esac

# Add registry prefix if specified
if [ -n "$REGISTRY" ]; then
    TAGS=("${TAGS[@]/#/$REGISTRY/}")
fi

echo -e "${GREEN}Building Docker image for ${ENVIRONMENT} environment${NC}"
echo -e "${YELLOW}Target: ${TARGET}${NC}"
echo -e "${YELLOW}Version: ${VERSION}${NC}"
echo -e "${YELLOW}Tags: ${TAGS[*]}${NC}"

# Build the image
echo -e "\n${GREEN}Building image...${NC}"
BUILD_CMD="docker build ${NO_CACHE} --target ${TARGET} -t ${TAGS[0]}"

# Add additional tags
for tag in "${TAGS[@]:1}"; do
    BUILD_CMD="${BUILD_CMD} -t ${tag}"
done

# Add build args
BUILD_CMD="${BUILD_CMD} --build-arg NODE_ENV=${ENVIRONMENT}"
BUILD_CMD="${BUILD_CMD} --build-arg BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
BUILD_CMD="${BUILD_CMD} --build-arg VERSION=${VERSION}"
BUILD_CMD="${BUILD_CMD} ."

echo -e "${YELLOW}Executing: ${BUILD_CMD}${NC}\n"
eval $BUILD_CMD

if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}Build successful!${NC}"

    # Display image size
    IMAGE_SIZE=$(docker images ${TAGS[0]} --format "{{.Size}}")
    echo -e "${GREEN}Image size: ${IMAGE_SIZE}${NC}"

    # Push to registry if requested
    if [ "$PUSH_IMAGE" = true ]; then
        if [ -z "$REGISTRY" ]; then
            echo -e "${RED}Cannot push: No registry specified${NC}"
            exit 1
        fi

        echo -e "\n${GREEN}Pushing images to registry...${NC}"
        for tag in "${TAGS[@]}"; do
            echo -e "${YELLOW}Pushing ${tag}...${NC}"
            docker push "${tag}"
        done
        echo -e "${GREEN}Push complete!${NC}"
    fi

    # Display summary
    echo -e "\n${GREEN}=== Build Summary ===${NC}"
    echo -e "Environment: ${ENVIRONMENT}"
    echo -e "Target: ${TARGET}"
    echo -e "Version: ${VERSION}"
    echo -e "Image Size: ${IMAGE_SIZE}"
    echo -e "\n${GREEN}Available tags:${NC}"
    for tag in "${TAGS[@]}"; do
        echo -e "  - ${tag}"
    done

    echo -e "\n${GREEN}To run the image:${NC}"
    if [ "$ENVIRONMENT" = "dev" ] || [ "$ENVIRONMENT" = "development" ]; then
        echo -e "  docker-compose -f docker-compose.yml -f docker-compose.dev.yml up"
    else
        echo -e "  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up"
    fi
else
    echo -e "\n${RED}Build failed!${NC}"
    exit 1
fi
