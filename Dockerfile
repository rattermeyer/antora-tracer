FROM caddy:2-alpine
COPY public/ /usr/share/caddy/
COPY caddy/Caddyfile /etc/caddy/Caddyfile
