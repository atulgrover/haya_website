#!/usr/bin/env bash
# ==============================================================================
# Agentic Professionals Master Stopper (Home)
# Stops all domains simultaneously:
#   • Port 3000: Root Gateway (agenticprofessionals.net / www.agenticprofessionals.net)
#   • Port 3002: IBC Sovereign Practice Hub (ibc.agenticprofessionals.net)
#   • Port 3003: BNS Criminal Law Hub (bns.agenticprofessionals.net)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RESET="\033[0m"

echo -e "${BOLD}🛑 Stopping All Agentic Professionals Domains Simultaneously...${RESET}\n"

stop_pid_file() {
    local pid_file="$1"
    local name="$2"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${CYAN}⏹ Terminating $name (PID: $pid)...${RESET}"
            pkill -P "$pid" 2>/dev/null || true
            kill -15 "$pid" 2>/dev/null || true
            sleep 1
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            echo -e "${GREEN}✔ Stopped $name${RESET}"
        fi
        rm -f "$pid_file"
    fi
}

kill_port() {
    local port="$1"
    local name="$2"
    local pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}🧹 Cleaning up port $port ($name)...${RESET}"
        echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
}

# Stop by PID files
stop_pid_file "$PID_DIR/home.pid" "Root Gateway (Port 3000)"
stop_pid_file "$PID_DIR/ibc.pid" "IBC Practice Hub (Port 3002)"
stop_pid_file "$PID_DIR/bns.pid" "BNS Criminal Law Hub (Port 3003)"

# Clean any lingering port listeners
kill_port 3000 "Root Gateway"
kill_port 3002 "IBC Practice Hub"
kill_port 3003 "BNS Criminal Law Hub"

echo ""
echo -e "${BOLD}${GREEN}✔ All Domains Successfully Terminated.${RESET}\n"
