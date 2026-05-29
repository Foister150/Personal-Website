# Stage 1 — build the Docusaurus blog
FROM node:22-alpine AS blog-build
WORKDIR /app
COPY blog-site/package.json blog-site/package-lock.json ./
RUN npm ci
COPY blog-site/ ./
RUN npm run build

# Stage 2 — serve both sites with Caddy.
# /srv/static is provided by a bind mount in docker-compose.yml.
FROM caddy:2-alpine
COPY --from=blog-build /app/build /srv/blog
COPY Caddyfile /etc/caddy/Caddyfile
EXPOSE 80
