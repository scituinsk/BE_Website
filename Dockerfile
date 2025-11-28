# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN apt-get update -y && apt-get install -y openssl \
    && npm install

COPY . .

# Prisma generate
COPY prisma ./prisma/
RUN npx prisma generate

# Build NestJS
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim AS production

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist
COPY .env ./

EXPOSE 1001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
