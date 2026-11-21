#!/usr/bin/env bash
# ==============================================================================
# Agentic Professionals Master Status Checker (Home)
# Checks status across all active domains
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
PID_DIR="$ROOT_DIR/.pids"
LOG_DIR="$ROOT_DIR/logs"

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
RED="\033[0;31m"
GRAY="\033[0;90m"
RESET="\033[0m"

echo -e "${BOLD}📋 All Agentic Professionals Domains Status${RESET}\n"

check_domain() {
    local name="$1"
    local port="$2"
    local url="$3"
    local log_file="$4"

    echo -e "${BOLD}${name}${RESET}"
    
    local port_pids=$(lsof -ti :"$port" 2>/dev/null | tr '\n' ' ' || true)

    if [ -n "$port_pids" ]; then
        echo -e "  Status: ${GREEN}● Running${RESET} (Port $port, PID(s): $port_pids)"
        echo -e "  URL:    $url"
    else
        echo -e "  Status: ${RED}○ Stopped${RESET} (Port $port is free)"
    fi

    if [ -f "$log_file" ]; then
        echo -e "  ${GRAY}Recent log ($log_file):${RESET}"
        tail -n 2 "$log_file" 2>/dev/null | sed 's/^/    /' || true
    fi
    echo ""
}

check_domain "🌐 ROOT GATEWAY (HOME)" 3000 "http://localhost:3000" "$LOG_DIR/home.log"
check_domain "🏛️  IBC PRACTICE HUB" 3002 "http://localhost:3002" "$LOG_DIR/ibc.log"
check_domain "⚖️  BNS CRIMINAL LAW HUB" 3003 "http://localhost:3003" "$LOG_DIR/bns.log"
