#!/bin/bash

# E2E Testing Script for Jianlin Next.js Project
# Tests all pages and verifies HTTP 200 responses

BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

echo "======================================"
echo "E2E Testing - Jianlin Next.js Project"
echo "======================================"
echo ""

# Function to test a URL
test_url() {
    local url=$1
    local name=$2
    echo -n "Testing $name... "

    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$http_code" = "200" ]; then
        echo "✓ PASS ($http_code)"
        ((PASS++))
    else
        echo "✗ FAIL ($http_code)"
        ((FAIL++))
    fi
}

# Test all static pages
echo ">>> Testing Static Pages"
test_url "$BASE_URL/" "Homepage"
test_url "$BASE_URL/about_us" "About Us"
test_url "$BASE_URL/hot_list" "Hot Cases List"
test_url "$BASE_URL/history_list" "History Cases List"
test_url "$BASE_URL/contact_us" "Contact Us"
test_url "$BASE_URL/real_estate_list" "Real Estate List"
echo ""

# Test dynamic hot case pages (only actual existing cases)
echo ">>> Testing Hot Case Detail Pages"
test_url "$BASE_URL/hot/hot001" "Hot Case: hot001"
echo ""

# Test dynamic history case pages (only actual existing cases)
echo ">>> Testing History Case Detail Pages"
test_url "$BASE_URL/history/history018" "History Case: history018"
echo ""

# Test reservation page with encoded project name
echo ">>> Testing Reservation Pages"
test_url "$BASE_URL/reservation/%E6%96%B0%E7%AB%B9%E4%B9%8B%E6%98%87" "Reservation: 新竹之昇"
echo ""

# Summary
echo "======================================"
echo "Test Summary"
echo "======================================"
echo "Total Tests: $((PASS + FAIL))"
echo "Passed: $PASS"
echo "Failed: $FAIL"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo "✓ ALL TESTS PASSED!"
    exit 0
else
    echo ""
    echo "✗ SOME TESTS FAILED"
    exit 1
fi
