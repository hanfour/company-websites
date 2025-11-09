#!/bin/bash

# 邦瓏建设 - 完整验证脚本
# 验证前台、后台、API、构建和类型检查

set -e  # 遇到错误立即退出

echo "🚀 开始全面验证邦瓏建设项目..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 验证计数
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# 检查函数
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "[$TOTAL_CHECKS] $1... "
}

pass() {
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    echo -e "${GREEN}✓ PASS${NC}"
}

fail() {
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    echo -e "${RED}✗ FAIL${NC}"
    echo "   错误: $1"
}

warn() {
    echo -e "${YELLOW}⚠ WARNING${NC}"
    echo "   警告: $1"
}

# ============================================
# 1. 验证环境配置
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 第 1 部分: 环境配置验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "检查 .env.local 文件存在"
if [ -f .env.local ]; then
    pass
else
    fail ".env.local 文件不存在"
fi

check "检查必要的环境变量"
if grep -q "STORAGE_TYPE" .env.local 2>/dev/null; then
    pass
else
    warn "STORAGE_TYPE 未设置，将使用默认值"
fi

check "检查 node_modules 安装"
if [ -d node_modules ]; then
    pass
else
    fail "node_modules 不存在，请运行 npm install"
fi

# ============================================
# 2. 验证 TypeScript 类型检查
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 第 2 部分: TypeScript 类型检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "运行 TypeScript 编译器检查"
if npx tsc --noEmit --pretty false 2>&1 | grep -q "error TS"; then
    fail "存在 TypeScript 类型错误"
    npx tsc --noEmit 2>&1 | grep "error TS" | head -5
else
    pass
fi

# ============================================
# 3. 验证 ESLint 代码质量
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📐 第 3 部分: ESLint 代码质量检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "运行 ESLint 检查"
if npm run lint 2>&1 | grep -q "error"; then
    fail "存在 ESLint 错误"
    npm run lint 2>&1 | grep "error" | head -5
else
    pass
fi

# ============================================
# 4. 验证构建
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏗️  第 4 部分: 生产构建验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "清理之前的构建产物"
rm -rf .next
pass

check "运行生产构建"
if npm run build > /tmp/banglong-build.log 2>&1; then
    pass
else
    fail "构建失败"
    tail -20 /tmp/banglong-build.log
fi

check "验证构建产物存在"
if [ -d .next ]; then
    pass
else
    fail ".next 目录不存在"
fi

# ============================================
# 5. 验证单元测试
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 第 5 部分: 单元测试验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check "运行 Vitest 单元测试"
if NODE_ENV=test npm test > /tmp/banglong-test.log 2>&1; then
    pass
    echo "   测试结果: $(grep 'Test Files' /tmp/banglong-test.log)"
else
    fail "单元测试失败"
    tail -20 /tmp/banglong-test.log
fi

# ============================================
# 6. 验证开发服务器和 API
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 第 6 部分: API 端点验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 检查服务器是否运行
check "检查开发服务器状态"
if curl -s http://localhost:3000/api/carousel > /dev/null 2>&1; then
    pass
else
    warn "开发服务器未运行，跳过 API 测试"
    echo "   提示: 运行 'npm run dev' 启动服务器后再测试"
    SKIP_API_TESTS=1
fi

if [ -z "$SKIP_API_TESTS" ]; then
    # 公开 API 测试
    check "GET /api/carousel"
    RESPONSE=$(curl -s http://localhost:3000/api/carousel)
    if echo "$RESPONSE" | grep -q "carouselItems"; then
        pass
    else
        fail "API 响应格式错误"
    fi

    check "GET /api/projects"
    RESPONSE=$(curl -s http://localhost:3000/api/projects)
    if echo "$RESPONSE" | grep -q "projects"; then
        pass
    else
        fail "API 响应格式错误"
    fi

    check "GET /api/handbooks"
    RESPONSE=$(curl -s http://localhost:3000/api/handbooks)
    if echo "$RESPONSE" | grep -q "handbooks"; then
        pass
    else
        fail "API 响应格式错误"
    fi

    check "POST /api/contacts (空数据应该被拒绝)"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3000/api/contacts -H "Content-Type: application/json" -d '{}')
    if [ "$STATUS" = "400" ]; then
        pass
    else
        fail "应该返回 400，实际返回 $STATUS"
    fi

    # 管理员 API 测试（应该返回 401）
    check "GET /api/carousel/admin (未认证应该被拒绝)"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/carousel/admin)
    if [ "$STATUS" = "401" ]; then
        pass
    else
        fail "应该返回 401，实际返回 $STATUS"
    fi

    check "GET /api/projects/admin (未认证应该被拒绝)"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/projects/admin)
    if [ "$STATUS" = "401" ]; then
        pass
    else
        fail "应该返回 401，实际返回 $STATUS"
    fi
fi

# ============================================
# 7. 验证路由可访问性
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🛣️  第 7 部分: 前台路由可访问性"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -z "$SKIP_API_TESTS" ]; then
    # 前台路由
    ROUTES=(
        "/"
        "/about"
        "/about/vision"
        "/about/spirit"
        "/about/related"
        "/arch"
        "/arch/classic"
        "/arch/future"
        "/service"
        "/service/process"
        "/service/handbook"
        "/device"
        "/device/maintenance"
        "/device/usage"
        "/device/troubleshooting"
        "/contact"
    )

    for route in "${ROUTES[@]}"; do
        check "GET $route"
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
        if [ "$STATUS" = "200" ]; then
            pass
        else
            fail "返回状态码 $STATUS"
        fi
    done
fi

# ============================================
# 8. 最终报告
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 验证报告"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "总检查项: $TOTAL_CHECKS"
echo -e "${GREEN}通过: $PASSED_CHECKS${NC}"
echo -e "${RED}失败: $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✓ 所有检查通过！项目完全正常 🎉${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}✗ 发现 $FAILED_CHECKS 个问题，请修复后重试${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    exit 1
fi
