FROM oven/bun:1-alpine AS deps

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/ui-react/package.json ./apps/ui-react/
COPY apps/cli/package.json ./apps/cli/
COPY packages/core/package.json ./packages/core/
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS release

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages/core/package.json ./packages/core/
COPY packages/core/src ./packages/core/src
COPY apps/api/package.json ./apps/api/
COPY apps/api/index.ts ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/drizzle ./apps/api/drizzle

EXPOSE 3000/tcp
ENV NODE_ENV=production

WORKDIR /app/apps/api

ENTRYPOINT ["bun", "run", "index.ts"]
