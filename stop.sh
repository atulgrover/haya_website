#!/usr/bin/env bash

# Resolve root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"

# Color formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}🛑 Stopping Agentic Professionals Federated Network (4 Domains)...${RESET}\n"

# Helper to kill process by PID file
stop_pid_file() {
    local pid_file="$1"
    local name="$2"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo -e "${CYAN}⏹ Terminating $name (PID: $pid)...${RESET}"
            # Kill process and its child process tree
            pkill -P "$pid" 2>/dev/null
            kill -15 "$pid" 2>/dev/null
            sleep 1
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null
            fi
            echo -e "${GREEN}✔ Stopped $name${RESET}"
        fi
        rm -f "$pid_file"
    fi
}

# Helper to force kill any remaining processes on designated ports
kill_port() {
    local port="$1"
    local name="$2"
    local pids=$(lsof -ti :"$port" 2>/dev/null)
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}🧹 Cleaning up orphaned process on port $port ($name)...${RESET}"
        echo "$pids" | xargs kill -9 2>/dev/null
    fi
}

# Stop each domain service by PID file
stop_pid_file "$PID_DIR/hayagriva.pid" "Hayagriva Sovereign Engine (Port 3000)"
stop_pid_file "$PID_DIR/portal.pid" "Apex Network Portal (Port 3001)"
stop_pid_file "$PID_DIR/ibc.pid" "IBC Practice Hub (Port 3002)"
stop_pid_file "$PID_DIR/bns.pid" "BNS Criminal Law Hub (Port 3003)"

# Ensure all 4 ports are completely freed
kill_port 3000 "Hayagriva Portal"
kill_port 3001 "Apex Portal"
kill_port 3002 "IBC Practice Hub"
kill_port 3003 "BNS Criminal Law Hub"

echo ""
echo -e "${BOLD}${GREEN}✔ All 4 Federated Domains have been stopped successfully.${RESET}"
echo ""
