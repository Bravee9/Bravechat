FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS builder
# Cài đặt libc6-compat cần thiết cho một số native modules trên alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Khởi tạo workspace cache
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

# Copy toàn bộ code và build API
COPY . .
RUN pnpm exec prisma generate --schema=packages/database/prisma/schema.prisma
RUN pnpm --filter=@discord-clone/api build

FROM base AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV production
ENV PORT 4000
ENV HOST 0.0.0.0

# Copy các dependencies đã cài đặt
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy code đã build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

EXPOSE 4000
CMD ["sh", "-c", "./node_modules/.bin/prisma db push --schema=packages/database/prisma/schema.prisma && node apps/api/dist/index.js"]
