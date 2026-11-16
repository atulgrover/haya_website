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

echo -e "${BOLD}🚀 Starting Agentic Professionals Federated Network (4 Domains)...${RESET}\n"

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

# 1. Start HAYAGRIVA Sovereign Engine & Web Portal (Port 3000)
HAYA_DIR="$SCRIPT_DIR/hayagriva.agenticprofessionals"
HAYA_PID_FILE="$PID_DIR/hayagriva.pid"
HAYA_LOG="$LOG_DIR/hayagriva.log"

if is_running "$HAYA_PID_FILE"; then
    echo -e "${YELLOW}⚡ Hayagriva Portal is already running (PID: $(cat "$HAYA_PID_FILE"))${RESET}"
else
    check_and_free_port 3000 "Hayagriva Portal"
    echo -e "${CYAN}▶ Starting Hayagriva Portal (Port 3000)...${RESET}"
    (cd "$HAYA_DIR" && node server.js >> "$HAYA_LOG" 2>&1) &
    HAYA_PID=$!
    echo "$HAYA_PID" > "$HAYA_PID_FILE"
    echo -e "${GREEN}✔ Hayagriva Portal spawned (PID: $HAYA_PID, logs: logs/hayagriva.log)${RESET}"
fi

# 2. Start APEX PORTAL Website (Port 3001)
PORTAL_DIR="$SCRIPT_DIR/portal.agenticprofessionals"
PORTAL_PID_FILE="$PID_DIR/portal.pid"
PORTAL_LOG="$LOG_DIR/portal.log"

if is_running "$PORTAL_PID_FILE"; then
    echo -e "${YELLOW}⚡ Apex Portal is already running (PID: $(cat "$PORTAL_PID_FILE"))${RESET}"
else
    check_and_free_port 3001 "Apex Portal"
    echo -e "${CYAN}▶ Starting Apex Portal (Port 3001)...${RESET}"
    (cd "$PORTAL_DIR" && node server/server.js >> "$PORTAL_LOG" 2>&1) &
    PORTAL_PID=$!
    echo "$PORTAL_PID" > "$PORTAL_PID_FILE"
    echo -e "${GREEN}✔ Apex Portal spawned (PID: $PORTAL_PID, logs: logs/portal.log)${RESET}"
fi

# 3. Start IBC Practice Portal (Port 3002)
IBC_DIR="$SCRIPT_DIR/ibc.agenticprofessionals"
IBC_PID_FILE="$PID_DIR/ibc.pid"
IBC_LOG="$LOG_DIR/ibc.log"

if is_running "$IBC_PID_FILE"; then
    echo -e "${YELLOW}⚡ IBC Practice Hub is already running (PID: $(cat "$IBC_PID_FILE"))${RESET}"
else
    check_and_free_port 3002 "IBC Portal"
    echo -e "${CYAN}▶ Starting IBC Practice Hub (Port 3002)...${RESET}"
    (cd "$IBC_DIR" && PORT=3002 ./bin/openibc-server >> "$IBC_LOG" 2>&1) &
    IBC_PID=$!
    echo "$IBC_PID" > "$IBC_PID_FILE"
    echo -e "${GREEN}✔ IBC Practice Hub spawned (PID: $IBC_PID, logs: logs/ibc.log)${RESET}"
fi

# 4. Start BNS Criminal Law Portal (Port 3003)
BNS_DIR="$SCRIPT_DIR/bns.agenticprofessionals"
BNS_PID_FILE="$PID_DIR/bns.pid"
BNS_LOG="$LOG_DIR/bns.log"

if is_running "$BNS_PID_FILE"; then
    echo -e "${YELLOW}⚡ BNS Criminal Law Hub is already running (PID: $(cat "$BNS_PID_FILE"))${RESET}"
else
    check_and_free_port 3003 "BNS Portal"
    echo -e "${CYAN}▶ Starting BNS Criminal Law Hub (Port 3003)...${RESET}"
    (cd "$BNS_DIR" && PORT=3003 ./bin/openbns-server >> "$BNS_LOG" 2>&1) &
    BNS_PID=$!
    echo "$BNS_PID" > "$BNS_PID_FILE"
    echo -e "${GREEN}✔ BNS Criminal Law Hub spawned (PID: $BNS_PID, logs: logs/bns.log)${RESET}"
fi

echo ""
echo -e "${BOLD}================================================================${RESET}"
echo -e "${BOLD}${GREEN}✔ All 4 Federated Domains Running Successfully!${RESET}"
echo -e "${BOLD}================================================================${RESET}"
echo -e "  🌐 ${CYAN}Apex Launchpad Network:${RESET}   http://localhost:3001  (portal.agenticprofessionals)"
echo -e "  ⚡ ${CYAN}Hayagriva Sovereign Engine:${RESET} http://localhost:3000  (hayagriva.agenticprofessionals)"
echo -e "  🏛️  ${CYAN}IBC Practice Hub:${RESET}         http://localhost:3002  (ibc.agenticprofessionals)"
echo -e "  ⚖️  ${CYAN}BNS Criminal Law Hub:${RESET}     http://localhost:3003  (bns.agenticprofessionals)"
echo ""
echo -e "  📊 Check status:   ${BOLD}./status.sh${RESET}"
echo -e "  🛑 Stop all apps:   ${BOLD}./stop.sh${RESET}"
echo -e "  📁 View logs in:    ${BOLD}logs/${RESET}"
echo ""
