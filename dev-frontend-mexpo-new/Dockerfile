# ============================================================
# Mexpo Frontend Dockerfile (Next.js 16 + React 19)
# ============================================================

FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy full application source
COPY . .

# Build Arguments with default fallbacks
ARG NEXT_PUBLIC_BASE_URL_DEVELOPMENT=http://backend:3500
ARG NEXT_PUBLIC_BASE_URL_PRODUCTION=http://localhost:3500
ARG NEXT_PUBLIC_BASIC_AUTH_USERNAME=bidinCaem
ARG NEXT_PUBLIC_BASIC_AUTH_PASSWORD=bidinGuruSMK
ARG NEXT_PUBLIC_TOKEN_KEY=mexpo-token
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=SB-Mid-client-IiW5j-bppphCXvWE
ARG NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=false
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=501093420723-o7hni0r5c48tmcvvqfnq94imutok4u7t.apps.googleusercontent.com

ENV NEXT_PUBLIC_BASE_URL_DEVELOPMENT=$NEXT_PUBLIC_BASE_URL_DEVELOPMENT
ENV NEXT_PUBLIC_BASE_URL_PRODUCTION=$NEXT_PUBLIC_BASE_URL_PRODUCTION
ENV NEXT_PUBLIC_BASIC_AUTH_USERNAME=$NEXT_PUBLIC_BASIC_AUTH_USERNAME
ENV NEXT_PUBLIC_BASIC_AUTH_PASSWORD=$NEXT_PUBLIC_BASIC_AUTH_PASSWORD
ENV NEXT_PUBLIC_TOKEN_KEY=$NEXT_PUBLIC_TOKEN_KEY
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=$NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ENV NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION=$NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js
RUN npm run build

# ============================================================
# Production Runner
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build output, node_modules and public files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/src ./src

EXPOSE 3000

CMD ["npm", "run", "start"]
