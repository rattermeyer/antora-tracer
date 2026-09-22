FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@10.33.0
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY patches/ patches/
COPY id-server/package.json id-server/
RUN pnpm install --frozen-lockfile --filter @antora-tracer/id-server
COPY id-server/tsconfig.json id-server/
COPY id-server/src/ id-server/src/
RUN pnpm --filter @antora-tracer/id-server run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm@10.33.0
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY patches/ patches/
COPY id-server/package.json id-server/
RUN pnpm install --frozen-lockfile --filter @antora-tracer/id-server --prod
COPY --from=build /app/id-server/lib/ /app/lib/
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 8080
CMD ["node", "lib/index.js", "/config/config.yml"]
