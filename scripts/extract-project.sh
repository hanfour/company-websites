#!/bin/bash

# 提取單一專案為獨立 Next.js 專案的腳本
# 使用方式: ./scripts/extract-project.sh jianlin /path/to/output

set -e

PROJECT_NAME=$1
OUTPUT_DIR=$2

if [ -z "$PROJECT_NAME" ] || [ -z "$OUTPUT_DIR" ]; then
  echo "使用方式: ./scripts/extract-project.sh <project-name> <output-directory>"
  echo "範例: ./scripts/extract-project.sh jianlin ~/Desktop/jianlin-standalone"
  exit 1
fi

if [ ! -d "apps/$PROJECT_NAME" ]; then
  echo "❌ 錯誤：找不到專案 apps/$PROJECT_NAME"
  exit 1
fi

echo "📦 開始提取專案: $PROJECT_NAME"
echo "📂 輸出目錄: $OUTPUT_DIR"

# 建立輸出目錄
mkdir -p "$OUTPUT_DIR"

# 1. 複製專案主體
echo "1️⃣ 複製專案檔案..."
cp -r "apps/$PROJECT_NAME/"* "$OUTPUT_DIR/"
cp -r "apps/$PROJECT_NAME/".* "$OUTPUT_DIR/" 2>/dev/null || true

# 2. 複製共用的 packages
echo "2️⃣ 複製共用套件..."
mkdir -p "$OUTPUT_DIR/packages"
cp -r packages/api-template "$OUTPUT_DIR/packages/"

# 3. 建立獨立的 package.json
echo "3️⃣ 更新 package.json..."
cd "$OUTPUT_DIR"

# 移除 workspace 相關設定
node -e "
const pkg = require('./package.json');
delete pkg.name;
pkg.name = '$PROJECT_NAME';
delete pkg.workspaces;

// 將 workspace 依賴改為本地路徑
if (pkg.dependencies) {
  Object.keys(pkg.dependencies).forEach(key => {
    if (key.startsWith('@repo/')) {
      const pkgName = key.replace('@repo/', '');
      pkg.dependencies[key] = 'file:./packages/' + pkgName;
    }
  });
}

require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2));
"

# 4. 建立獨立的 .gitignore
echo "4️⃣ 建立 .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# Typescript
*.tsbuildinfo
next-env.d.ts

# Packages
/packages/*/node_modules
/packages/*/.next
/packages/*/dist
EOF

# 5. 建立 README.md
echo "5️⃣ 建立 README.md..."
cat > README.md << EOF
# $PROJECT_NAME

這是從 Monorepo 提取的獨立 Next.js 專案。

## 開發

\`\`\`bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 建置
npm run build

# 啟動生產環境
npm start
\`\`\`

## 環境變數

請複製 \`.env.local.example\` 為 \`.env.local\` 並填入正確的值。

## 部署

### Vercel
\`\`\`bash
vercel
\`\`\`

### Docker
\`\`\`bash
docker build -t $PROJECT_NAME .
docker run -p 3000:3000 $PROJECT_NAME
\`\`\`
EOF

# 6. 初始化 Git
echo "6️⃣ 初始化 Git..."
git init
git add .
git commit -m "Initial commit: Extract $PROJECT_NAME from monorepo"

echo ""
echo "✅ 提取完成！"
echo ""
echo "📁 專案位置: $OUTPUT_DIR"
echo ""
echo "📋 下一步："
echo "   1. cd $OUTPUT_DIR"
echo "   2. npm install"
echo "   3. 複製 .env.local.example 為 .env.local"
echo "   4. npm run dev"
echo ""
echo "🚀 部署到 Vercel："
echo "   vercel"
