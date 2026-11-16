#!/usr/bin/env bash

# Resolve root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"
LOG_DIR="$SCRIPT_DIR/logs"

mkdir -p "$PID_DIR"
mkdir -p "$LOG_DIR"

# Color formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}🚀 Starting OpenIBC Ecosystem (3 Applications)...${RESET}\n"

# Helper to check if a process is running
is_running() {
    local pid_file="$1"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Helper to verify and clear a port
check_and_free_port() {
    local port="$1"
    local name="$2"
    local pids=$(lsof -ti :"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}⚠️  Port $port ($name) is currently occupied by PID(s): $pids${RESET}"
        echo -e "   Killing process(es) on port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# 1. Start OPENIBC - HARNESS (Ports 3000, 3001, 8888)
HARNESS_DIR="$SCRIPT_DIR/OPENIBC - HARNESS"
HARNESS_PID_FILE="$PID_DIR/harness.pid"
HARNESS_LOG="$LOG_DIR/harness.log"

if is_running "$HARNESS_PID_FILE"; then
    echo -e "${YELLOW}⚡ OPENIBC - HARNESS is already running (PID: $(cat "$HARNESS_PID_FILE"))${RESET}"
else
    check_and_free_port 3000 "Harness Frontend"
    check_and_free_port 3001 "Harness Server"
    check_and_free_port 8888 "Harness Collector"
    
    echo -e "${CYAN}▶ Starting OPENIBC - HARNESS (yarn dev)...${RESET}"
    (cd "$HARNESS_DIR" && yarn dev >> "$HARNESS_LOG" 2>&1) &
    HARNESS_PID=$!
    echo "$HARNESS_PID" > "$HARNESS_PID_FILE"
    echo -e "${GREEN}✔ OPENIBC - HARNESS spawned (PID: $HARNESS_PID, logs: logs/harness.log)${RESET}"
fi

# 2. Start OPENIBC - PORTAL (Port 3300)
PORTAL_DIR="$SCRIPT_DIR/OPENIBC - PORTAL"
PORTAL_PID_FILE="$PID_DIR/portal.pid"
PORTAL_LOG="$LOG_DIR/portal.log"

if is_running "$PORTAL_PID_FILE"; then
    echo -e "${YELLOW}⚡ OPENIBC - PORTAL is already running (PID: $(cat "$PORTAL_PID_FILE"))${RESET}"
else
    check_and_free_port 3300 "Portal App"
    
    echo -e "${CYAN}▶ Starting OPENIBC - PORTAL (npm run dev)...${RESET}"
    (cd "$PORTAL_DIR" && npm run dev >> "$PORTAL_LOG" 2>&1) &
    PORTAL_PID=$!
    echo "$PORTAL_PID" > "$PORTAL_PID_FILE"
    echo -e "${GREEN}✔ OPENIBC - PORTAL spawned (PID: $PORTAL_PID, logs: logs/portal.log)${RESET}"
fi

# 3. Start OPENIBC - WEBSITE (Port 3600)
WEBSITE_DIR="$SCRIPT_DIR/OPENIBC - WEBSITE"
WEBSITE_PID_FILE="$PID_DIR/website.pid"
WEBSITE_LOG="$LOG_DIR/website.log"

if is_running "$WEBSITE_PID_FILE"; then
    echo -e "${YELLOW}⚡ OPENIBC - WEBSITE is already running (PID: $(cat "$WEBSITE_PID_FILE"))${RESET}"
else
    check_and_free_port 3600 "Website App"
    
    echo -e "${CYAN}▶ Starting OPENIBC - WEBSITE (npm run dev)...${RESET}"
    (cd "$WEBSITE_DIR" && npm run dev >> "$WEBSITE_LOG" 2>&1) &
    WEBSITE_PID=$!
    echo "$WEBSITE_PID" > "$WEBSITE_PID_FILE"
    echo -e "${GREEN}✔ OPENIBC - WEBSITE spawned (PID: $WEBSITE_PID, logs: logs/website.log)${RESET}"
fi

echo ""
echo -e "${BOLD}======================================================${RESET}"
echo -e "${BOLD}${GREEN}✔ All 3 applications started in background!${RESET}"
echo -e "${BOLD}======================================================${RESET}"
echo -e "  🌐 ${CYAN}OPENIBC - WEBSITE:${RESET}  http://localhost:3600"
echo -e "  🏛️  ${CYAN}OPENIBC - PORTAL:${RESET}   http://localhost:3300"
echo -e "  ⚖️  ${CYAN}OPENIBC - HARNESS:${RESET}  http://localhost:3000  (API: :3001, Collector: :8888)"
echo ""
echo -e "  📊 Check status:  ${BOLD}./status.sh${RESET}"
echo -e "  🛑 Stop all apps:  ${BOLD}./stop.sh${RESET}"
echo -e "  📁 View logs in:   ${BOLD}logs/${RESET}"
echo ""

