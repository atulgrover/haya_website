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

echo -e "${BOLD}🚀 Starting Agentic Professionals Sovereign Digital Network (3 Hubs)...${RESET}\n"

# Helper to check if a process is running
is_running() {
    local pid_file="$1"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
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

# Ensure retired legacy port 3000 is clean
check_and_free_port 3000 "Legacy Hayagriva Port"
rm -f "$PID_DIR/hayagriva.pid"

# 1. Start IAS SOVEREIGN ACADEMY (Port 3001)
IAS_DIR="$SCRIPT_DIR/ias.agenticprofessionals"
IAS_PID_FILE="$PID_DIR/ias.pid"
IAS_LOG="$LOG_DIR/ias.log"

if is_running "$IAS_PID_FILE"; then
    echo -e "${YELLOW}⚡ IAS Sovereign Academy is already running (PID: $(cat "$IAS_PID_FILE"))${RESET}"
else
    check_and_free_port 3001 "IAS Academy"
    echo -e "${CYAN}▶ Starting IAS Sovereign Academy (Port 3001)...${RESET}"
    cd "$IAS_DIR"
    nohup node server/server.js >> "$IAS_LOG" 2>&1 &
    IAS_PID=$!
    disown "$IAS_PID" 2>/dev/null || true
    echo "$IAS_PID" > "$IAS_PID_FILE"
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✔ IAS Sovereign Academy spawned (PID: $IAS_PID, logs: logs/ias.log)${RESET}"
fi

# 2. Start IBC Practice Portal (Port 3002)
IBC_DIR="$SCRIPT_DIR/ibc.agenticprofessionals"
IBC_PID_FILE="$PID_DIR/ibc.pid"
IBC_LOG="$LOG_DIR/ibc.log"

if is_running "$IBC_PID_FILE"; then
    echo -e "${YELLOW}⚡ IBC Practice Hub is already running (PID: $(cat "$IBC_PID_FILE"))${RESET}"
else
    check_and_free_port 3002 "IBC Portal"
    echo -e "${CYAN}▶ Starting IBC Practice Hub (Port 3002)...${RESET}"
    cd "$IBC_DIR"
    nohup ./bin/openibc-server >> "$IBC_LOG" 2>&1 &
    IBC_PID=$!
    disown "$IBC_PID" 2>/dev/null || true
    echo "$IBC_PID" > "$IBC_PID_FILE"
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✔ IBC Practice Hub spawned (PID: $IBC_PID, logs: logs/ibc.log)${RESET}"
fi

# 3. Start BNS Criminal Law Portal (Port 3003)
BNS_DIR="$SCRIPT_DIR/bns.agenticprofessionals"
BNS_PID_FILE="$PID_DIR/bns.pid"
BNS_LOG="$LOG_DIR/bns.log"

if is_running "$BNS_PID_FILE"; then
    echo -e "${YELLOW}⚡ BNS Criminal Law Hub is already running (PID: $(cat "$BNS_PID_FILE"))${RESET}"
else
    check_and_free_port 3003 "BNS Portal"
    echo -e "${CYAN}▶ Starting BNS Criminal Law Hub (Port 3003)...${RESET}"
    cd "$BNS_DIR"
    nohup ./bin/openbns-server >> "$BNS_LOG" 2>&1 &
    BNS_PID=$!
    disown "$BNS_PID" 2>/dev/null || true
    echo "$BNS_PID" > "$BNS_PID_FILE"
    cd "$SCRIPT_DIR"
    echo -e "${GREEN}✔ BNS Criminal Law Hub spawned (PID: $BNS_PID, logs: logs/bns.log)${RESET}"
fi

echo ""
echo -e "${BOLD}================================================================${RESET}"
echo -e "${BOLD}${GREEN}✔ All 3 Sovereign Digital Hubs Running Successfully!${RESET}"
echo -e "${BOLD}================================================================${RESET}"
echo -e "  🎓 ${CYAN}IAS Sovereign Academy:${RESET}        http://localhost:3001  (ias.agenticprofessionals)"
echo -e "  🏛️  ${CYAN}IBC Practice Hub:${RESET}             http://localhost:3002  (ibc.agenticprofessionals)"
echo -e "  ⚖️  ${CYAN}BNS Criminal Law Hub:${RESET}         http://localhost:3003  (bns.agenticprofessionals)"
echo ""
echo -e "  📊 Check status:   ${BOLD}./status.sh${RESET}"
echo -e "  🛑 Stop all apps:   ${BOLD}./stop.sh${RESET}"
echo -e "  📁 View logs in:    ${BOLD}logs/${RESET}"
echo ""

# Automatically open port 3001 (IAS Sovereign Academy) in browser
echo -e "${BOLD}${CYAN}🚀 Launching IAS Sovereign Academy in browser...${RESET}"
sleep 1
if command -v open > /dev/null 2>&1; then
    open "http://localhost:3001"
elif command -v xdg-open > /dev/null 2>&1; then
    xdg-open "http://localhost:3001" &
fi
echo -e "${GREEN}✔ Browser tab opened.${RESET}\n"
