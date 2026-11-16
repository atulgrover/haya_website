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

echo -e "${BOLD}🛑 Stopping OpenIBC Ecosystem (3 Applications)...${RESET}\n"

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

# Stop each service by PID file
stop_pid_file "$PID_DIR/website.pid" "OPENIBC - WEBSITE"
stop_pid_file "$PID_DIR/portal.pid" "OPENIBC - PORTAL"
stop_pid_file "$PID_DIR/harness.pid" "OPENIBC - HARNESS"

# Ensure all designated ports are completely freed
kill_port 3600 "Website"
kill_port 3300 "Portal"
kill_port 3000 "Harness Frontend"
kill_port 3001 "Harness Server"
kill_port 8888 "Harness Collector"

echo ""
echo -e "${BOLD}${GREEN}✔ All OpenIBC services have been stopped successfully.${RESET}"
echo ""

