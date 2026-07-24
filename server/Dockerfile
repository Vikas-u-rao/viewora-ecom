# Server Dockerfile for VIEWORA Express API + Prisma

FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

# Copy package files and install all dependencies (including devDependencies for build)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client & Build TypeScript
RUN npx prisma generate
RUN npm run build
RUN npx tsc prisma/seed.ts --module commonjs --esModuleInterop --target es2020 --skipLibCheck

# --- Production Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=5000

# Copy package files & install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production
RUN npx prisma generate

# Copy built dist files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/seed.js ./prisma/seed.js

# Expose backend port
EXPOSE 5000

# Start server
CMD ["node", "dist/index.js"]
