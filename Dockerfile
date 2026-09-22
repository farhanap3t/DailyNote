# Multi-stage build for DailyNote
FROM node:24-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies and build client
RUN npm --prefix client install
COPY client/ ./client/
RUN npm --prefix client run build

RUN npm --prefix server install --omit=dev
COPY server/ ./server/

# Production image
FROM node:24-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY package.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/src/index.js"]

