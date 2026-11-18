# syntax=docker/dockerfile:1

# Slim Node base: no sudo, no root login, only the packages below.
# Pinned by digest; Dependabot keeps it current.
FROM node:26-trixie-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc

ARG PNPM_VERSION=12.21.0

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        git \
        less \
        openssh-client \
        procps \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g "pnpm@${PNPM_VERSION}" \
    && npm cache clean --force

# Pre-create node_modules owned by `node`; Docker copies that
# ownership into the volume on first mount.
RUN mkdir -p /workspace/node_modules \
    && chown -R node:node /workspace

ENV NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/home/node/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

USER node
WORKDIR /workspace
