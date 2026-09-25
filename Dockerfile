# ==============================================================================
# Google Cloud Run Multi-Stage High-Performance Dockerfile
# Optimized for Fast Cold-Starts (<2s), V8 Engine Tuning & Ingress Compression
# ==============================================================================

# Stage 1: Build Frontend Assets and Server Binary
FROM node:22-alpine AS builder

WORKDIR /app

# Enable libc compatibility for faster compilation
RUN apk add --no-cache libc6-compat

# Copy dependency manifests
COPY package.json ./

# Install all dependencies for build phase
RUN npm install --legacy-peer-deps

# Copy project source files
COPY . .

# Compile optimized static bundle and single-file server runtime
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Ultra-Lightweight Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Add dumb-init for POSIX signal handling & curl for Cloud Run health probes
RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV PORT=3000
# V8 Heap & GC Tuning for Google Cloud Run (4GB RAM Profile)
ENV NODE_OPTIONS="--max-old-space-size=3072 --enable-source-maps=false"

# Copy package manifest and install runtime-only dependencies
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps && npm cache clean --force

# Copy compiled bundles from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public 2>/dev/null || true
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/server.ts ./server.ts 2>/dev/null || true
COPY --from=builder /app/tsconfig*.json ./ 2>/dev/null || true

# Expose standard Cloud Run port
EXPOSE 3000

# Cloud Run Container Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1:${PORT:-3000}/api/health || exit 1

# dumb-init forwards SIGTERM/SIGINT properly to allow graceful connection draining
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
