# Production Multi-Stage Dockerfile for IMovies Backend
FROM node:24-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Install non-root user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 imovies && \
    mkdir -p /app/uploads && \
    chown -R imovies:nodejs /app

COPY --from=base /app/node_modules ./node_modules
COPY --chown=imovies:nodejs . .

USER imovies

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health/ping || exit 1

CMD ["node", "src/server.js"]
