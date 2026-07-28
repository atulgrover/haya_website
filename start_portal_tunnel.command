#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

echo "======================================================="
echo "🚀 Starting HAYA PORTAL Express Server & Cloudflare Tunnel"
echo "======================================================="

# Start Node.js Express server on port 3000 in background
node server/server.js &
SERVER_PID=$!

echo "✅ Haya Portal Server running (PID: $SERVER_PID)"
echo "📡 Launching Cloudflare Tunnel..."
echo "-------------------------------------------------------"

# Launch Cloudflare Quick Tunnel to port 3000
cloudflared tunnel --url http://localhost:3000

# Cleanup server on exit
kill $SERVER_PID
