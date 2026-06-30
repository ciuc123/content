# Simple Dockerfile for local development
FROM node:20-alpine

WORKDIR /usr/src/app

# Install small OS deps we need for downloads
RUN apk add --no-cache curl ca-certificates bash git openssh || true

# Copy package manifest first and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --silent || true

# Attempt to install GitHub Copilot CLI (best-effort).
# The container will try to download and extract the binary from GitHub releases.
RUN set -eux; \
  if ! command -v copilot >/dev/null 2>&1; then \
    mkdir -p /tmp/copilot-dl; \
    cd /tmp/copilot-dl; \
    # Try multiple possible release asset names (prefer x64, fallback to arm64)
    for file in copilot-linux-x64.tar.gz copilot-linux-arm64.tar.gz copilot-linuxmusl-x64.tar.gz copilot-linuxmusl-arm64.tar.gz; do \
      url="https://github.com/github/copilot-cli/releases/latest/download/$file"; \
      echo "Trying to download $url"; \
      if curl -fSL "$url" -o "copilot.tar.gz"; then \
        tar -xzf copilot.tar.gz && \
        if [ -f copilot ]; then \
          mv copilot /usr/local/bin/copilot && \
          chmod +x /usr/local/bin/copilot && \
          break; \
        fi; \
      fi; \
    done; \
    cd /; \
    rm -rf /tmp/copilot-dl; \
  fi

# Copy rest of the application
COPY . .

ENV NODE_ENV=development
EXPOSE 3000

# Startup command - extract GitHub token and start the app
CMD sh -c '\
  echo "========================================="; \
  echo "Starting Ideas Content Engine"; \
  echo "========================================="; \
  if [ -f /opt/copilot/copilot ]; then \
    ln -sf /opt/copilot/copilot /usr/local/bin/copilot || true; \
    echo "✓ Copilot CLI linked"; \
  fi; \
  if [ -f /root/.config/gh/hosts.yml ]; then \
    echo "✓ Found gh config, extracting token..."; \
    TOKEN=$(grep -A2 "github.com:" /root/.config/gh/hosts.yml | grep "oauth_token:" | awk "{print \$2}" | tr -d "\n" 2>/dev/null || true); \
    if [ -n "$TOKEN" ]; then \
      export COPILOT_GITHUB_TOKEN="$TOKEN"; \
      echo "✓ COPILOT_GITHUB_TOKEN set"; \
    fi; \
  else \
    echo "⚠️  No gh config found"; \
  fi; \
  echo "========================================="; \
  npm install && npm run dev; \
'
