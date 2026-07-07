# syntax=docker/dockerfile:1

# Production image for La Feria CR (Next.js standalone output) — Azure Container Apps.
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# --- deps: install all deps (dev deps needed for build + prisma generate) ---
FROM base AS deps
COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci

# --- builder: generate Prisma client + build the standalone server ---
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
# Public GA4 measurement id (e.g. G-XXXXXXXXXX). NEXT_PUBLIC_* is inlined at build time, so it
# must be present during `next build`, not just at runtime. Empty by default → GA disabled.
ARG NEXT_PUBLIC_GA_ID=""
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# --- runner: minimal runtime ---
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone output bundles the server + only the node_modules it traced.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
