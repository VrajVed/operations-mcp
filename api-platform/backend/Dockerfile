# Build context is api-platform/ (the pnpm workspace root), not this directory —
# pnpm needs the workspace manifest and lockfile to resolve backend's deps.
#
# pnpm version is pinned to match local dev (`pnpm -v`) rather than letting
# corepack fetch latest — pnpm 11.21+ requires Node 22.13+, which breaks on
# the node:20 base image with ERR_UNKNOWN_BUILTIN_MODULE (node:sqlite).
FROM node:22-alpine AS deps
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json ./backend/package.json
COPY client/package.json ./client/package.json
RUN CI=true pnpm install --frozen-lockfile --filter backend...

FROM node:22-alpine AS build
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
COPY --from=deps /workspace ./
COPY backend/ ./backend/
RUN pnpm --filter backend build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.3.0 --activate
ENV NODE_ENV=production
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY backend/package.json ./backend/package.json
COPY client/package.json ./client/package.json
RUN CI=true pnpm install --frozen-lockfile --prod --filter backend...
COPY --from=build /workspace/backend/dist ./backend/dist

WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "dist/index.js"]
