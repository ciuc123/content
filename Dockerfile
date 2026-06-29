# Simple Dockerfile for local development
FROM node:20-alpine

WORKDIR /usr/src/app

# Install small OS deps we need for downloads
RUN apk add --no-cache curl ca-certificates bash git openssh || true

# Copy package manifest first and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --silent || true

# Attempt to install GitHub Copilot CLI (best-effort).
# The container will try multiple routes: npm global package and GitHub releases binary.
RUN set -eux; \
  if ! command -v copilot >/dev/null 2>&1; then \
    npm i -g @githubnext/copilot-cli@latest || true; \
    curl -fSL https://github.com/github/copilot-cli/releases/latest/download/copilot-linux-amd64 -o /usr/local/bin/copilot || true; \
    chmod +x /usr/local/bin/copilot || true; \
  fi

# Copy rest of the application
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

CMD ["npm", "run", "dev"]
