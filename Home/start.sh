#!/usr/bin/env bash
# ==============================================================================
# Agentic Professionals Master Orchestrator (Home)
# Starts all portals simultaneously:
#   • Port 3000: Root Gateway (Home)
#   • Port 3001: IAS Sovereign Academy (ias.agenticprofessionals)
#   • Port 3002: OpenIBC Sovereign Practice Hub (ibc.agenticprofessionals)
#   • Port 3003: OpenBNS Criminal Law Hub (bns.agenticprofessionals)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$PID_DIR"
mkdir -p "$LOG_DIR"

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo -e "${BOLD}🚀 Starting Agentic Professionals Portals Simultaneously...${RESET}\n"

is_port_listening() {
    local port="$1"
    local pids=$(lsof -ti :"$port" 2>/dev/null || true)
    [ -n "$pids" ]
}

# ------------------------------------------------------------------------------
# 0. Start HOME ROOT GATEWAY (Port 3000)
# ------------------------------------------------------------------------------
HOME_PID_FILE="$PID_DIR/home.pid"
HOME_LOG="$LOG_DIR/home.log"

if is_port_listening 3000; then
    HOME_PID=$(lsof -ti :3000 | head -n 1)
    echo "$HOME_PID" > "$HOME_PID_FILE"
    echo -e "${GREEN}⚡ Root Gateway (Home) is already live (PID: $HOME_PID, Port: 3000)${RESET}"
else
    echo -e "${CYAN}▶ Starting Root Gateway (Port 3000)...${RESET}"
    cd "$SCRIPT_DIR"
    (nohup node server.js < /dev/null >> "$HOME_LOG" 2>&1 &)
    sleep 1
    HOME_PID=$(lsof -ti :3000 | head -n 1)
    if [ -n "$HOME_PID" ]; then
        echo "$HOME_PID" > "$HOME_PID_FILE"
        echo -e "${GREEN}✔ Root Gateway spawned (PID: $HOME_PID, Port: 3000)${RESET}"
    else
        echo -e "${YELLOW}⚠ Root Gateway spawned, awaiting port 3000${RESET}"
    fi
fi

# ------------------------------------------------------------------------------
# 1. Start IAS SOVEREIGN ACADEMY (Port 3001)
# ------------------------------------------------------------------------------
IAS_DIR="$ROOT_DIR/ias.agenticprofessionals"
IAS_PID_FILE="$PID_DIR/ias.pid"
IAS_LOG="$LOG_DIR/ias.log"

if is_port_listening 3001; then
    IAS_PID=$(lsof -ti :3001 | head -n 1)
    echo "$IAS_PID" > "$IAS_PID_FILE"
    echo -e "${GREEN}⚡ IAS Sovereign Academy is already live (PID: $IAS_PID, Port: 3001)${RESET}"
else
    echo -e "${CYAN}▶ Starting IAS Sovereign Academy (Port 3001)...${RESET}"
    cd "$IAS_DIR"
    (nohup node server/server.js < /dev/null >> "$IAS_LOG" 2>&1 &)
    sleep 1
    IAS_PID=$(lsof -ti :3001 | head -n 1)
    if [ -n "$IAS_PID" ]; then
        echo "$IAS_PID" > "$IAS_PID_FILE"
        echo -e "${GREEN}✔ IAS Sovereign Academy spawned (PID: $IAS_PID, Port: 3001)${RESET}"
    else
        echo -e "${YELLOW}⚠ IAS Sovereign Academy spawned, awaiting port 3001${RESET}"
    fi
fi

# ------------------------------------------------------------------------------
# 2. Start IBC PRACTICE PORTAL (Port 3002)
# ------------------------------------------------------------------------------
IBC_DIR="$ROOT_DIR/ibc.agenticprofessionals"
IBC_PID_FILE="$PID_DIR/ibc.pid"
IBC_LOG="$LOG_DIR/ibc.log"

if is_port_listening 3002; then
    IBC_PID=$(lsof -ti :3002 | head -n 1)
    echo "$IBC_PID" > "$IBC_PID_FILE"
    echo -e "${GREEN}⚡ IBC Practice Hub is already live (PID: $IBC_PID, Port: 3002)${RESET}"
else
    echo -e "${CYAN}▶ Starting IBC Practice Hub (Port 3002)...${RESET}"
    cd "$IBC_DIR"
    (nohup ./bin/openibc-server < /dev/null >> "$IBC_LOG" 2>&1 &)
    sleep 1
    IBC_PID=$(lsof -ti :3002 | head -n 1)
    if [ -n "$IBC_PID" ]; then
        echo "$IBC_PID" > "$IBC_PID_FILE"
        echo -e "${GREEN}✔ IBC Practice Hub spawned (PID: $IBC_PID, Port: 3002)${RESET}"
    else
        echo -e "${YELLOW}⚠ IBC Practice Hub spawned, awaiting port 3002${RESET}"
    fi
fi

# ------------------------------------------------------------------------------
# 3. Start BNS CRIMINAL LAW PORTAL (Port 3003)
# ------------------------------------------------------------------------------
BNS_DIR="$ROOT_DIR/bns.agenticprofessionals"
BNS_PID_FILE="$PID_DIR/bns.pid"
BNS_LOG="$LOG_DIR/bns.log"

if is_port_listening 3003; then
    BNS_PID=$(lsof -ti :3003 | head -n 1)
    echo "$BNS_PID" > "$BNS_PID_FILE"
    echo -e "${GREEN}⚡ BNS Criminal Law Hub is already live (PID: $BNS_PID, Port: 3003)${RESET}"
else
    echo -e "${CYAN}▶ Starting BNS Criminal Law Hub (Port 3003)...${RESET}"
    cd "$BNS_DIR"
    (nohup ./bin/openbns-server < /dev/null >> "$BNS_LOG" 2>&1 &)
    sleep 1
    BNS_PID=$(lsof -ti :3003 | head -n 1)
    if [ -n "$BNS_PID" ]; then
        echo "$BNS_PID" > "$BNS_PID_FILE"
        echo -e "${GREEN}✔ BNS Criminal Law Hub spawned (PID: $BNS_PID, Port: 3003)${RESET}"
    else
        echo -e "${YELLOW}⚠ BNS Criminal Law Hub spawned, awaiting port 3003${RESET}"
    fi
fi

cd "$SCRIPT_DIR"

echo ""
echo -e "${BOLD}================================================================${RESET}"
echo -e "${BOLD}${GREEN}✔ Portals Are Live & Running Simultaneously!${RESET}"
echo -e "${BOLD}================================================================${RESET}"
echo -e "  🌐 ${CYAN}Root Gateway (Home):${RESET}         http://localhost:3000"
echo -e "  🎓 ${CYAN}IAS Sovereign Academy:${RESET}       http://localhost:3001  (ias.agenticprofessionals)"
echo -e "  🏛️  ${CYAN}IBC Practice Hub:${RESET}            http://localhost:3002  (ibc.agenticprofessionals)"
echo -e "  ⚖️  ${CYAN}BNS Criminal Law Hub:${RESET}        http://localhost:3003  (bns.agenticprofessionals)"
echo ""
echo -e "  📊 Check status:   ${BOLD}./status.sh${RESET}"
echo -e "  🛑 Stop all apps:   ${BOLD}./stop.sh${RESET}"
echo ""
