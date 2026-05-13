# ===== Stage 1: Build Frontend =====
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ===== Stage 2: Build Server =====
FROM node:20-alpine AS server-builder

WORKDIR /app/server

# Install server dependencies
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# Copy server source and build
COPY server/ .
RUN npm run build

# ===== Stage 3: Production =====
FROM node:20-alpine

WORKDIR /app

# Copy server build + production dependencies
COPY --from=server-builder /app/server/dist ./dist
COPY --from=server-builder /app/server/node_modules ./node_modules
COPY --from=server-builder /app/server/package.json ./

# Copy frontend build → served as static files by Express
COPY --from=frontend-builder /app/dist ./public

# Data directory for SQLite (mount as PersistentVolume in production)
RUN mkdir -p /app/data

ENV PORT=4000
ENV DB_DIR=/app/data
ENV NODE_ENV=production

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:4000/api/health || exit 1

CMD ["node", "dist/index.js"]
