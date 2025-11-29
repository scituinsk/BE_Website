# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./

# Install OpenSSL (Wajib)
RUN apt-get update -y && apt-get install -y openssl \
    && npm install

# Copy folder prisma
COPY prisma ./prisma/

# 1. Generate Prisma Client
# Karena ada custom output, file akan tergenerate di /usr/src/app/src/generated/prisma
RUN npx prisma generate

# Copy source code sisanya
COPY . .

# 2. Build NestJS
# Proses ini akan membuat folder dist, tapi seringkali file binary Prisma ketinggalan
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim AS production

WORKDIR /usr/src/app

# Install OpenSSL (Wajib di Production juga)
RUN apt-get update -y && apt-get install -y openssl

COPY package*.json ./

# Install dependencies production
RUN npm install --omit=dev

# 1. Copy App Build (berisi generated yang 'rusak/ompong')
COPY --from=builder /usr/src/app/dist ./dist

# 2. FIX UTAMA: TIMPA folder generated di dalam dist
# Kita ambil folder generated yang SEHAT dari builder, dan taruh di dalam dist
# agar menggantikan file yang tidak lengkap hasil compile TS.
# COPY --from=builder /usr/src/app/generated ./dist/generated

# 3. Copy Prisma Schema (untuk migrate deploy)
COPY --from=builder /usr/src/app/prisma ./prisma

# Copy file .env
COPY .env ./

EXPOSE 1001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/main.js"]