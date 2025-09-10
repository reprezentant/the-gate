#!/usr/bin/env bash
set -euo pipefail

echo "Running clean.sh: removing node_modules, lock files and freeing ports (5173,5174,3000)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ -d node_modules ]; then
  echo "Removing node_modules..."
  rm -rf node_modules
else
  echo "node_modules not found"
fi

# Remove common lockfiles
for f in package-lock.json yarn.lock pnpm-lock.yaml npm-shrinkwrap.json; do
  if [ -f "$f" ]; then
    echo "Removing $f"
    rm -f "$f"
  fi
done

# Kill processes listening on ports (platform dependent)
kill_port() {
  local port="$1"
  echo "Checking port $port..."
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -iTCP:"$port" -sTCP:LISTEN -t || true)
    if [ -n "$pids" ]; then
      echo "Killing PIDs: $pids"
      kill -9 $pids || true
    else
      echo "No listening process found by lsof for port $port"
    fi
  elif command -v ss >/dev/null 2>&1; then
    pids=$(ss -ltnp "sport = :$port" 2>/dev/null | awk -F"pid=" '{print $2}' | awk -F"," '{print $1}' | tr -d ' ' || true)
    if [ -n "$pids" ]; then
      echo "Killing PIDs: $pids"
      kill -9 $pids || true
    else
      echo "No listening process found by ss for port $port"
    fi
  else
    echo "No lsof/ss available; trying netstat fallback"
    if command -v netstat >/dev/null 2>&1; then
      pids=$(netstat -ano | grep ":$port" | awk '{print $NF}' | sort -u || true)
      if [ -n "$pids" ]; then
        echo "Killing PIDs (netstat): $pids"
        kill -9 $pids || true
      else
        echo "No PIDs found by netstat for port $port"
      fi
    else
      echo "No netstat available; cannot determine processes for port $port"
    fi
  fi
}

for p in 5173 5174 3000; do
  kill_port "$p"
done

echo "Clean finished."
