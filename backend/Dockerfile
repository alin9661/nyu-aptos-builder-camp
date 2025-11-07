# Multi-stage Dockerfile for NYU Aptos Backend
# Optimized for both development and production environments

# ==============================================================================
# Base Stage - Common foundation for all stages
# ==============================================================================
FROM node:20-alpine AS base

# Install system dependencies needed for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

WORKDIR /app

# Add labels for metadata
LABEL maintainer="NYU Aptos Builder Camp"
LABEL description="Backend API for Aptos governance and treasury management"
LABEL version="1.0.0"

# ==============================================================================
# Dependencies Stage - Install all dependencies
# ==============================================================================
FROM base AS dependencies

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies)
RUN npm ci

# Install production dependencies separately for production stage
RUN npm ci --only=production --ignore-scripts && \
    mv node_modules node_modules_prod

# Restore all dependencies
RUN npm ci

# ==============================================================================
# Build Stage - Compile TypeScript to JavaScript
# ==============================================================================
FROM dependencies AS build

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript project
RUN npm run build

# ==============================================================================
# Development Stage - Hot reload with nodemon
# ==============================================================================
FROM base AS development

# Copy all dependencies (including dev dependencies)
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

# Expose application port
EXPOSE 3001

# Set environment to development
ENV NODE_ENV=development

# Use nodemon for hot reload
CMD ["npm", "run", "dev"]

# ==============================================================================
# Production Stage - Optimized for production deployment
# ==============================================================================
FROM base AS production

# Copy only production dependencies
COPY --from=dependencies /app/node_modules_prod ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist

# Copy package.json for metadata
COPY package*.json ./

# Create non-root user for security
RUN addgroup -g 1000 nodeuser && \
    adduser -u 1000 -G nodeuser -s /bin/sh -D nodeuser && \
    chown -R nodeuser:nodeuser /app

# Switch to non-root user
USER nodeuser

# Expose application port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Health check - verify app is responding
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
