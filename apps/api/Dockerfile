FROM node:20 AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

RUN npm install

COPY . .

FROM oven/bun:alpine

COPY --from=builder /app/apps/api /app/apps/api
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/node_modules /app/node_modules

RUN mkdir -p /app/data
ENV DATA_DIR=/app/data
VOLUME /app/data

WORKDIR /app/apps/api
EXPOSE 3000

CMD ["bun", "run", "start"]
