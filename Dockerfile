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
    # Try multiple possible release asset names (best-effort)
    for file in copilot-linux-amd64 copilot-linux-x86_64 copilot-linux copilot; do \
      url="https://github.com/github/copilot-cli/releases/latest/download/$file"; \
      echo "Trying to download $url"; \
      curl -fSL "$url" -o /usr/local/bin/copilot && break || true; \
    done; \
    chmod +x /usr/local/bin/copilot || true; \
  fi

# Copy rest of the application
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

CMD ["npm", "run", "dev"]
