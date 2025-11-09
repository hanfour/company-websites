# Storage Configuration Guide

邦瓏建設官网现已支持两种存储后端：

## 选项 1: Prisma + PostgreSQL (默认)

**优点**：
- ✅ 高性能，低延迟
- ✅ 支持复杂查询
- ✅ 事务支持
- ✅ 已配置完成，开箱即用

**缺点**：
- ❌ 需要 PostgreSQL 数据库
- ❌ 可能有配额限制

**配置**：
```bash
# .env 或 .env.local
STORAGE_TYPE=prisma  # 或者不设置，默认就是 prisma
POSTGRES_PRISMA_URL=your_database_url
```

## 选项 2: JSON + S3 (推荐用于官网)

**优点**：
- ✅ 无需数据库，节省配额
- ✅ 数据以 JSON 文件形式存储在 S3
- ✅ 容易备份和恢复
- ✅ 成本更低

**缺点**：
- ❌ 查询性能较 PostgreSQL 低
- ❌ 不支持复杂的关系查询
- ❌ 需要配置 S3 或兼容服务

**推荐服务**：

### AWS S3
```bash
# .env 或 .env.local
STORAGE_TYPE=json
S3_BUCKET=banglong-data
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
```

### Cloudflare R2 (推荐，免费额度更大)
```bash
# .env 或 .env.local
STORAGE_TYPE=json
S3_BUCKET=banglong-data
S3_REGION=auto
S3_ACCESS_KEY_ID=your_r2_access_key
S3_SECRET_ACCESS_KEY=your_r2_secret_key
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

## 迁移步骤

### 从 Prisma 迁移到 JSON

1. **导出现有数据**：
   ```bash
   npx tsx scripts/export-to-json.ts
   ```
   这会创建 `data-export/` 目录，包含所有数据的 JSON 文件。

2. **配置 S3**：
   - 创建 S3 bucket（或 Cloudflare R2 bucket）
   - 获取访问凭证
   - 在 `.env.local` 中配置环境变量

3. **上传数据到 S3**：
   ```bash
   npx tsx scripts/upload-to-s3.ts
   ```

4. **切换存储模式**：
   ```bash
   # .env.local
   STORAGE_TYPE=json
   ```

5. **重启应用**：
   ```bash
   npm run dev
   ```

6. **测试所有功能**：
   ```bash
   npm test
   ```

### 从 JSON 迁移回 Prisma

1. **下载 S3 数据**：
   ```bash
   # 手动下载或使用 AWS CLI
   aws s3 sync s3://banglong-data ./data-export
   ```

2. **导入到 PostgreSQL**：
   ```bash
   npx tsx scripts/import-from-json.ts  # TODO: 需要创建此脚本
   ```

3. **切换存储模式**：
   ```bash
   # .env.local
   STORAGE_TYPE=prisma
   ```

## Cloudflare R2 设置指南

### 1. 创建 R2 Bucket

1. 登录 Cloudflare Dashboard
2. 进入 R2 → Create bucket
3. Bucket 名称：`banglong-data`
4. 位置：自动

### 2. 创建 API Token

1. R2 → Manage R2 API Tokens → Create API Token
2. 权限：Admin Read & Write
3. 保存 Access Key ID 和 Secret Access Key

### 3. 获取 Endpoint URL

格式：`https://<account-id>.r2.cloudflarestorage.com`

在 R2 设置页面可以找到你的 account ID。

### 4. 配置环境变量

```bash
STORAGE_TYPE=json
S3_BUCKET=banglong-data
S3_REGION=auto
S3_ACCESS_KEY_ID=your_r2_access_key_id
S3_SECRET_ACCESS_KEY=your_r2_secret_access_key
S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
```

## 性能对比

| 操作 | Prisma + PostgreSQL | JSON + S3 |
|------|---------------------|-----------|
| 读取单条记录 | ~10ms | ~50-100ms |
| 读取列表 | ~20ms | ~100-200ms |
| 创建记录 | ~30ms | ~150-300ms |
| 更新记录 | ~30ms | ~200-400ms |
| 删除记录 | ~30ms | ~150-300ms |

**结论**：对于低流量的官网，JSON + S3 的性能完全可以接受。

## 成本对比 (以 Vercel 为例)

### Prisma + PostgreSQL (Vercel Postgres)
- 免费额度：256MB 存储，60小时计算时间/月
- 超额费用：$20/月起

### JSON + Cloudflare R2
- 免费额度：10GB 存储，无限读取，无出站流量费用
- 超额费用：$0.015/GB/月

**推荐**：对于官网项目，使用 JSON + Cloudflare R2 可以完全免费运行。

## 故障排查

### 错误：Storage initialization failed

**原因**：环境变量配置不正确

**解决**：
1. 检查 `.env.local` 文件
2. 确认所有必需的变量都已设置
3. 重启开发服务器

### 错误：S3 upload failed

**原因**：S3 凭证无效或 bucket 不存在

**解决**：
1. 验证 S3_ACCESS_KEY_ID 和 S3_SECRET_ACCESS_KEY
2. 确认 bucket 已创建
3. 检查 S3_REGION 是否正确

### 性能问题

**症状**：API 响应缓慢

**解决**：
1. 检查是否使用了 JSON 存储模式
2. 考虑添加缓存层（Redis/Vercel KV）
3. 或切换回 Prisma 模式

## 推荐配置

**开发环境**：
```bash
STORAGE_TYPE=prisma
DATABASE_URL=postgresql://localhost:5432/banglong_dev
```

**生产环境（低成本）**：
```bash
STORAGE_TYPE=json
S3_BUCKET=banglong-data
S3_REGION=auto
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=xxx
S3_ENDPOINT=https://xxx.r2.cloudflarestorage.com
```

**生产环境（高性能）**：
```bash
STORAGE_TYPE=prisma
POSTGRES_PRISMA_URL=postgresql://...
```

---

**最后更新**：2025-11-08
**联系人**：@hanfourhuang
