# Base image
FROM node:20-bookworm-slim AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally and openssl for Prisma
RUN apt-get update && apt-get install -y openssl && npm install -g pnpm

# Copy package management files
COPY package.json pnpm-lock.yaml ./

# Copy prisma schema so client can be generated
COPY prisma ./prisma/

# pnpm patch 파일 복사 (wouter 패치용)
COPY patches ./patches/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the project (Vite and ESBuild)
RUN pnpm run build

# ==========================================
# Production Stage
# ==========================================
FROM node:20-bookworm-slim AS runner

WORKDIR /app

# Install pnpm globally and openssl in the runner stage
RUN apt-get update && apt-get install -y openssl && npm install -g pnpm

# Copy only the necessary files from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD sh -c "npx prisma db push && pnpm run start"
