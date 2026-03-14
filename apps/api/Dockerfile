FROM oven/bun:1-debian AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/ui-react/package.json ./apps/ui-react/
COPY apps/cli/package.json ./apps/cli/
COPY packages/core/package.json ./packages/core/
RUN bun install --frozen-lockfile

COPY packages/core/package.json ./packages/core/
COPY packages/core/src ./packages/core/src
COPY apps/api/package.json ./apps/api/
COPY apps/api/index.ts ./apps/api/
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/

RUN cd apps/api && \
    SKIP_ENV_VALIDATION=1 bun build index.ts \
    --compile \
    --target=bun \
    --outfile=../../dist/server

FROM debian:bookworm-slim AS release

WORKDIR /app

COPY --from=build /app/dist/server ./server
COPY apps/api/drizzle ./drizzle

EXPOSE 3000/tcp
ENV NODE_ENV=production

ENTRYPOINT ["./server"]
