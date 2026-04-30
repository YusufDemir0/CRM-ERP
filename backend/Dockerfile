# ============================================================
# Ermay ERP Backend — Multi-Target Dockerfile
# ============================================================
# Builds both API and Worker from the same codebase.
# Usage:
#   docker build --target production -t ermay-api .
#   docker run ermay-api node dist/main.js     (API)
#   docker run ermay-api node dist/worker.js   (Worker)
# ============================================================

# ── Stage 1: Install Dependencies ──────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./
RUN npm install --only=production && \
    cp -R node_modules /prod_modules && \
    npm install

# ── Stage 2: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ── Stage 3: Production ───────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy only production node_modules and compiled output
COPY --from=deps /prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production

# Default: API server. Override with CMD in docker-compose for worker.
EXPOSE 5143
CMD ["node", "dist/main.js"]
