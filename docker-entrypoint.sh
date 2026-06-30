#!/bin/sh
# Entrypoint script for web container
# Automatically extracts GitHub token from gh config and starts the app

set -e

echo "========================================="
echo "Starting Ideas Content Engine"
echo "========================================="

# Create symlink for copilot binary if it exists
if [ -f /opt/copilot/copilot ]; then
    ln -sf /opt/copilot/copilot /usr/local/bin/copilot || true
    echo "✓ Copilot CLI linked at /usr/local/bin/copilot"
fi

# Extract GitHub token from gh config if available
if [ -f /root/.config/gh/hosts.yml ]; then
    echo "✓ Found gh config, extracting token for Copilot..."

    # Extract oauth_token from gh config (YAML format)
    TOKEN=$(grep -A2 'github.com:' /root/.config/gh/hosts.yml | grep 'oauth_token:' | awk '{print $2}' | tr -d '\n' 2>/dev/null || true)

    if [ -n "$TOKEN" ]; then
        export COPILOT_GITHUB_TOKEN="$TOKEN"
        echo "✓ COPILOT_GITHUB_TOKEN set from gh config (auto-extracted)"
    else
        echo "⚠️  Could not extract token from gh config"
    fi
else
    echo "⚠️  No gh config found at /root/.config/gh/hosts.yml"
    echo "   To authenticate: Run on your host machine: gh auth login"
fi

echo "========================================="
echo "Installing dependencies..."
npm install

echo "Starting Next.js dev server..."
npm run dev
