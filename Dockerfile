# Multi-Stage Production Dockerfile for CLAQ Fiscal Alert

# Stage 1: Build Frontend SPA
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Server & Static Nginx / Node Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=frontend-builder /app/dist ./dist
COPY server ./server
COPY prisma ./prisma

EXPOSE 4000 5173

CMD ["node", "--loader", "ts-node/esm", "server/src/main.ts"]
