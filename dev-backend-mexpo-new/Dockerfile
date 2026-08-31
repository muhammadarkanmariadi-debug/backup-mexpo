# ============================================================
# Mexpo Backend Dockerfile (NestJS 11 + Prisma)
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL and build utilities for Prisma & native deps
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests
COPY package*.json ./
COPY tsconfig*.json nest-cli.json ./

# Install all dependencies
RUN npm ci

# Copy prisma schema, configs, and application source
COPY prisma ./prisma/
COPY src ./src
COPY scripts ./scripts
COPY prisma.config.ts ./

# Set build-time environment fallback so prisma generation and nest build succeed
ENV NODE_ENV=production
ENV DB_PROVIDER=postgresql
ENV DB_HOST=localhost
ENV DB_PORT=5432
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=postgres

# Generate Prisma Client and Build NestJS distribution
RUN npx prisma generate
RUN npm run build

# ============================================================
# Production Runner
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat netcat-openbsd

ENV NODE_ENV=production
ENV PORT=3500

# Copy application assets and node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3500

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "dist/src/main"]
