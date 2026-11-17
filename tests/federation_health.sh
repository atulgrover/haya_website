#!/usr/bin/env bash
# ==============================================================================
# Agentic Professionals Federated Network Health Verification
# Asserts 200 OK across all 3 live hubs (Port 3001, Port 3002, Port 3003)
# ==============================================================================

set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
CYAN="\033[0;36m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
RESET="\033[0m"

echo -e "${BOLD}🩺 Running Tri-Domain Federation Health Checks...${RESET}\n"

check_endpoint() {
    local url="$1"
    local desc="$2"
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "FAILED")

    if [ "$status" = "200" ] || [ "$status" = "304" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
        echo -e "  ${GREEN}✔ [HTTP $status]${RESET} $desc (${CYAN}$url${RESET})"
    else
        echo -e "  ${RED}✖ [HTTP $status]${RESET} $desc (${CYAN}$url${RESET})"
        return 1
    fi
}

echo -e "${BOLD}1. Apex Portal & Training Hub (Port 3001)${RESET}"
check_endpoint "http://localhost:3001/" "Launchpad Root"
check_endpoint "http://localhost:3001/employees" "Employee NSQF Route Alias"
check_endpoint "http://localhost:3001/employers" "Employer SOP Route Alias"
check_endpoint "http://localhost:3001/entrepreneurs" "Entrepreneur MSME Route Alias"
check_endpoint "http://localhost:3001/reports" "Vedic Reports Route Alias"

echo -e "\n${BOLD}2. IBC Practice Hub (Port 3002)${RESET}"
check_endpoint "http://localhost:3002/" "OpenIBC Root"

echo -e "\n${BOLD}3. BNS Criminal Law Hub (Port 3003)${RESET}"
check_endpoint "http://localhost:3003/" "OpenBNS Root"

echo -e "\n${BOLD}${GREEN}🎉 All Federated Endpoints Responding Healthy!${RESET}"
