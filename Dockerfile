# Multi-Stage Production Dockerfile for CLAQ Fiscal Alert (AWS Serverless Backend)
# For local development and Docker-based deployment

# -------------------------------------------------------------
# Stage 1: Build Frontend SPA
# -------------------------------------------------------------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Build Backend + Lambda Bundles
# -------------------------------------------------------------
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN node scripts/build-lambdas.mjs

# -------------------------------------------------------------
# Stage 3: Local Development Runner (Non-Root)
# -------------------------------------------------------------
FROM node:22-alpine AS dev-runner
WORKDIR /app

ENV NODE_ENV=development

RUN apk add --no-cache dumb-init

COPY backend/package*.json ./
RUN npm ci
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-builder /app/backend/dist ./dist
COPY backend/prisma ./prisma

RUN chown -R node:node /app
USER node

EXPOSE 4000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["npx", "tsx", "src/api.ts"]

# -------------------------------------------------------------
# Stage 4: Production Runner (Lambda-compatible, Non-Root)
# -------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache dumb-init

COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=frontend-builder /app/frontend/dist ./public

RUN chown -R node:node /app
USER node

EXPOSE 4000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/lambdas/api/index.js"]
