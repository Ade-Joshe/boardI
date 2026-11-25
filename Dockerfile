# syntax=docker/dockerfile:1

# Build on Debian slim, run on distroless (no shell, non-root).
# Same Debian release in both so native modules like sharp still work.

FROM node:26-trixie-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc AS deps
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
RUN npm install -g pnpm@12.21.0 && npm cache clean --force
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store

FROM deps AS build
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build \
    && mkdir -p .next/standalone/.next/cache

FROM gcr.io/distroless/nodejs26-debian13:nonroot@sha256:ffa8a7545403036c94ec76674b5dbac2d425af2d679147cdf3e30180071487b7 AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

# App files are root-owned and read-only; only .next/cache is writable.
# `pnpm build` already copied .next/static and public/ in.
COPY --from=build /app/.next/standalone ./
COPY --from=build --chown=nonroot:nonroot /app/.next/standalone/.next/cache ./.next/cache

USER nonroot
EXPOSE 3000
CMD ["server.js"]
