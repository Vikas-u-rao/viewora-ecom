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
