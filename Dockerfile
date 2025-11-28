# ---- Stage 1: Build ----
FROM node:22-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# ---- Stage 2: Production ----
FROM node:22-slim AS production

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 1001
CMD ["node", "dist/src/main"]