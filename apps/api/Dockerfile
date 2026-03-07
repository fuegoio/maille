FROM oven/bun:1 AS release

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/ui-react/package.json ./apps/ui-react/
COPY apps/cli/package.json ./apps/cli/
COPY packages/core/package.json ./packages/core/
RUN bun install --frozen-lockfile --production

COPY . .

EXPOSE 3000/tcp
ENV NODE_ENV production

WORKDIR /app/apps/api

ENTRYPOINT ["bun", "run", "start"]
