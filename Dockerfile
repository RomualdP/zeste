FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/domain/package.json packages/domain/
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source and build
COPY tsconfig.base.json ./
COPY packages/shared/ packages/shared/
COPY packages/domain/ packages/domain/
COPY apps/api/ apps/api/
RUN pnpm --filter @zeste/shared build
RUN pnpm --filter @zeste/domain build
RUN pnpm --filter @zeste/api build

# Production image
FROM node:20-slim AS production
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY packages/domain/package.json packages/domain/
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

COPY --from=base /app/packages/shared/dist packages/shared/dist
COPY --from=base /app/packages/domain/dist packages/domain/dist
COPY --from=base /app/apps/api/dist apps/api/dist

EXPOSE 3000
CMD ["node", "apps/api/dist/server.js"]
