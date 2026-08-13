# syntax=docker/dockerfile:1
# Build context must be ./services (workspace root with pnpm-lock.yaml)

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.12.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY core-api/package.json core-api/package.json
RUN pnpm install --frozen-lockfile --filter core-api...

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/core-api/node_modules ./core-api/node_modules
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY core-api core-api
WORKDIR /app/core-api
# Placeholder só pra `prisma generate` resolver o config — não conecta no banco,
# só gera o client a partir do schema. Valor real vem em runtime (docker-compose).
ENV DATABASE_URL="postgresql://user:password@localhost:5432/core_api?schema=public"
RUN pnpm exec prisma generate
RUN pnpm run build

FROM base AS prod-deps
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY core-api/package.json core-api/package.json
RUN pnpm install --frozen-lockfile --prod --filter core-api...

FROM node:22-alpine AS runner
WORKDIR /app/core-api
ENV NODE_ENV=production
RUN addgroup -S app && adduser -S app -G app
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-deps /app/core-api/node_modules ./node_modules
COPY --from=build /app/core-api/dist ./dist
COPY --from=build /app/core-api/package.json ./package.json
COPY --from=build /app/core-api/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/core-api/infra ./infra
USER app
EXPOSE 3000
# migrate deploy só aplica migrations pendentes (idempotente) — roda a cada start,
# mas com o api dependendo de postgres:service_healthy no compose, o banco já está de pé.
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/src/main.js"]
