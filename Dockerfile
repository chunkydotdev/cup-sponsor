# syntax=docker/dockerfile:1

# better-sqlite3 is a native addon, so the image it is compiled in has to match
# the image it runs in. Same base for both stages, glibc not musl.
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable

FROM base AS deps
WORKDIR /app
# python3/make/g++ are only needed to build the sqlite binding, and only here.
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* is inlined at build time, not read at runtime. Without this the
# card form silently never loads in production.
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_PLAUSIBLE_SRC
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY \
    NEXT_PUBLIC_PLAUSIBLE_SRC=$NEXT_PUBLIC_PLAUSIBLE_SRC \
    NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    CUPSPONSOR_DATA_DIR=/data

# Runs as the image's own `node` user, which is uid 1000 — the same uid as the
# first login user on a typical Linux host. That matters because /data is a bind
# mount: it shadows whatever the image says about ownership and brings the
# host directory's uid with it. A container user that does not match cannot
# write there, and sqlite fails with CANTOPEN. (On macOS this never shows up —
# Docker Desktop rewrites bind-mount ownership to whoever is asking.)
RUN mkdir -p /data && chown node:node /data

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Nothing else to copy: serverExternalPackages keeps better-sqlite3 out of the
# bundle, and Next's file tracer puts the package and its compiled .node binding
# inside .next/standalone itself.

USER node
EXPOSE 3000
CMD ["node", "server.js"]
