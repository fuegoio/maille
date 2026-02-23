FROM oven/bun:1 AS build

WORKDIR /app

COPY package.json bun.lock ./
COPY apps/api/package.json ./apps/api/
COPY apps/ui-react/package.json ./apps/ui-react/
COPY packages/core/package.json ./packages/core/
RUN bun install --frozen-lockfile

COPY . .

WORKDIR /app/apps/ui-react
ENV NODE_ENV=production
ENV VITE_API_URL=/api
RUN bun run build

FROM nginx:alpine AS release

COPY /apps/ui-react/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/ui-react/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
