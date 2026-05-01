#!/usr/bin/env bash
# claudex one-liner installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Mattai1/claudex/main/scripts/install.sh | bash
#
# What it does:
#   1. Verifies node >= 20 is installed
#   2. Installs claudex globally via npm
#   3. Runs claudex init
#
# It does NOT install Claude Code itself — see https://www.anthropic.com/claude-code

set -euo pipefail

CLAUDEX_VERSION="${CLAUDEX_VERSION:-latest}"

say() { printf "\033[1m▶\033[0m %s\n" "$1"; }
warn() { printf "\033[33m⚠\033[0m %s\n" "$1" >&2; }
err() { printf "\033[31m✗\033[0m %s\n" "$1" >&2; exit 1; }

# 1. node check
if ! command -v node >/dev/null 2>&1; then
  err "Node.js not found. Install Node 20+ first: https://nodejs.org/"
fi
NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
  err "Node 20+ required (you have $(node -v)). Upgrade and retry."
fi

# 2. npm check
if ! command -v npm >/dev/null 2>&1; then
  err "npm not found. Install npm with your Node distribution."
fi

# 3. install
say "Installing claudex@${CLAUDEX_VERSION} globally…"
if ! npm install -g "claudex@${CLAUDEX_VERSION}"; then
  err "npm install failed. Try: sudo npm install -g claudex (if permissions issue)"
fi

# 4. claude code check (warn only)
if ! command -v claude >/dev/null 2>&1; then
  warn "Claude Code is not installed. Install it next:"
  echo "    npm install -g @anthropic-ai/claude-code"
fi

# 5. init
say "Running claudex init…"
claudex init

cat <<'EOF'

✓ claudex installed.

Next:
  claudex providers           # see who you can connect to
  claudex add <name>          # add your first profile

Docs: https://github.com/Mattai1/claudex#readme
EOF
