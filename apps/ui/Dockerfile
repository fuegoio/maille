FROM node:20 AS builder

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/ui/package.json ./apps/ui/package.json

RUN npm install

COPY . .

WORKDIR /app/apps/ui
RUN npm run build-only

FROM nginx:alpine

WORKDIR /usr/share/nginx/
RUN rm -rf html
RUN mkdir html

WORKDIR /
COPY apps/ui/deploy/nginx.conf /etc/nginx
COPY apps/ui/deploy/start.sh /

COPY --from=builder /app/apps/ui/dist /usr/share/nginx/html
COPY --from=builder /app/apps/ui/dist/index.html /usr/share/nginx/html/index.template.html

ENTRYPOINT ["./start.sh"]
