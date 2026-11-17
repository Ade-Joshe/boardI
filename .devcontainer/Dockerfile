# syntax=docker/dockerfile:1

# Dev image. Built from the official slim Node image rather than a "batteries
# included" devcontainer base so there is no sudo, no passwordless root and
# only the packages listed below. Pinned by digest; Dependabot bumps it.
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

# The workspace path is fixed (see workspaceMount in devcontainer.json) so that
# node_modules can be pre-created here with the right owner. Docker copies this
# ownership into the named volume the first time it is mounted.
RUN mkdir -p /workspace/node_modules \
    && chown -R node:node /workspace

ENV NEXT_TELEMETRY_DISABLED=1 \
    PNPM_HOME=/home/node/.local/share/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

USER node
WORKDIR /workspace
