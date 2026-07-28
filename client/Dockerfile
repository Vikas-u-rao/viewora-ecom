# Client Dockerfile for VIEWORA Next.js Frontend

FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition files
COPY package*.json ./

RUN npm ci

# Copy client source code
COPY . .

# Set environment variables for build
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# BACKEND_URL is used by next.config.ts rewrites() — must be set at BUILD TIME
# because Next.js bakes rewrites into routes-manifest.json during `next build`
ARG BACKEND_URL=https://viewora-api-app-b7f8gdhpg9gacqej.centralindia-01.azurewebsites.net
ENV BACKEND_URL=$BACKEND_URL
ARG INTERNAL_API_URL=https://viewora-api-app-b7f8gdhpg9gacqej.centralindia-01.azurewebsites.net/api/v1
ENV INTERNAL_API_URL=$INTERNAL_API_URL

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js project
RUN npm run build

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
# BACKEND_URL and INTERNAL_API_URL must be set via container environment at runtime
# (e.g., Azure App Service → Configuration → Application settings)
# Defaults here point to the Azure backend; override per-environment as needed.
ENV BACKEND_URL=https://viewora-api-app-b7f8gdhpg9gacqej.centralindia-01.azurewebsites.net
ENV INTERNAL_API_URL=https://viewora-api-app-b7f8gdhpg9gacqej.centralindia-01.azurewebsites.net/api/v1

# Create non-root node user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy public assets & built application from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Grant permissions to nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
