#!/usr/bin/env bash

# Resolve root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_DIR="$SCRIPT_DIR/.pids"
LOG_DIR="$SCRIPT_DIR/logs"

# Color formatting
BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
GRAY="\033[0;90m"
RESET="\033[0m"

echo -e "${BOLD}📋 OpenIBC Services Status${RESET}\n"

check_service() {
    local name="$1"
    local pid_file="$2"
    local port="$3"
    local url="$4"
    local log_file="$5"

    echo -e "${BOLD}${name}${RESET}"
    
    local port_pids=$(lsof -ti :"$port" 2>/dev/null)
    local pid=""
    if [ -f "$pid_file" ]; then
        pid=$(cat "$pid_file")
    fi

    if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
        echo -e "  Status: ${GREEN}● Running${RESET} (PID: $pid, Port: $port)"
        echo -e "  URL:    $url"
    elif [ -n "$port_pids" ]; then
        echo -e "  Status: ${YELLOW}● Listening on port $port (PID(s): $port_pids)${RESET}"
        echo -e "  URL:    $url"
    else
        echo -e "  Status: ${RED}○ Stopped${RESET}"
    fi

    if [ -f "$log_file" ]; then
        echo -e "  ${GRAY}Recent log ($log_file):${RESET}"
        tail -n 2 "$log_file" 2>/dev/null | sed 's/^/    /'
    fi
    echo ""
}

check_service "OPENIBC - WEBSITE" "$PID_DIR/website.pid" 3600 "http://localhost:3600" "$LOG_DIR/website.log"
check_service "OPENIBC - PORTAL" "$PID_DIR/portal.pid" 3300 "http://localhost:3300" "$LOG_DIR/portal.log"
check_service "OPENIBC - HARNESS (Frontend)" "$PID_DIR/harness.pid" 3000 "http://localhost:3000" "$LOG_DIR/harness.log"
check_service "OPENIBC - HARNESS (Server API)" "$PID_DIR/harness.pid" 3001 "http://localhost:3001" "$LOG_DIR/harness.log"

