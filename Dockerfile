# Base Dockerfile for all NestJS microservices
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for building)
# Using npm install instead of npm ci to handle lock file sync
RUN npm install --legacy-peer-deps

# Copy entire monorepo source
COPY . .

# Development stage - used for local development with hot reload
FROM base AS development
ENV NODE_ENV=development
# Default command will be overridden in docker-compose

# Production build stage
FROM base AS builder
RUN npm run build --if-present

# Production stage
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts and proto files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/proto ./proto

# Default command (will be overridden per service)
CMD ["node", "dist/apps/api-gateway/main.js"]