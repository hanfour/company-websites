# Company Websites Monorepo - Claude Code 指南

## 项目结构

这是一个 **npm workspaces monorepo**，包含多个网站和共享包：

```
company-websites/
├── apps/
│   ├── banglong/          # 邦隆建設 (www.banglong.tw)
│   └── jianlin/           # 建霖建設
├── packages/
│   ├── storage/           # 共享存储层 (@repo/storage)
│   ├── types/             # 共享类型定义
│   └── ...
├── vercel.json            # Vercel 部署配置（重要！）
└── package.json           # npm workspaces 配置
```

---

## 部署方式：Vercel CLI

**重要：本项目使用 Vercel CLI 直接部署，不是通过 GitHub Git Integration 自动部署。**

### 部署 banglong (邦隆建設)

```bash
# 在项目根目录执行
cd /Users/hanfourhuang/Projects/company-websites
vercel --prod --yes
```

**注意事项：**
1. 必须从 **monorepo 根目录** 执行 `vercel` 命令
2. 根目录的 `vercel.json` 配置了只构建 banglong：
   - `buildCommand`: `turbo build --filter=@repo/banglong`
   - `outputDirectory`: `apps/banglong/.next`
3. **不要**在 `apps/banglong` 目录下执行 `vercel` 命令

### 部署 jianlin (建霖建設)

jianlin 有独立的 Vercel 项目，部署方式类似但需要切换项目：

```bash
# 需要先配置 jianlin 的 vercel.json 或使用 --project 参数
# TODO: 待配置
```

---

## Vercel 项目配置

### banglong 项目设置

- **Project ID**: `prj_UUEYKM1dmhwfcHmqlpT3IJVcQL6J`
- **Team ID**: `team_77Gpp7LLruzJaQCHPm6SgsAN`
- **Production URL**: https://www.banglong.tw
- **Root Directory**: 空（从仓库根目录）
- **Framework**: Next.js
- **Build Command**: `turbo build --filter=@repo/banglong`
- **Output Directory**: `apps/banglong/.next`
- **Install Command**: `npm install`

### 关键文件

- `/vercel.json` - 根目录配置，指定构建 banglong
- `/apps/banglong/vercel.json` - banglong 特定配置（API 函数超时等）
- `/apps/banglong/.vercel/project.json` - Vercel 项目链接

---

## 常见问题

### Q: 为什么不用 GitHub Git Integration 自动部署？

A: 因为这是 monorepo，需要精确控制构建哪个 app。Vercel CLI 配合根目录的 `vercel.json` 可以确保只构建目标 app。

### Q: 部署失败怎么办？

1. **检查是否在根目录执行命令**
2. **检查 `vercel.json` 是否存在且配置正确**
3. **查看 Vercel 部署日志**：`vercel logs <deployment-url>`

### Q: 如何查看部署状态？

```bash
vercel ls
# 或查看特定项目
vercel ls banglong
```

---

## Git 工作流

1. 在对应的 app 目录下开发和测试
2. 提交代码到 Git
3. **手动执行** `vercel --prod --yes` 部署到生产环境

```bash
# 完整流程示例
git add .
git commit -m "feat: 新功能描述"
git push origin main
vercel --prod --yes
```

---

## 环境变量

每个 app 的环境变量在 Vercel 项目设置中配置，不在代码中。

- banglong: https://vercel.com/hanfours-projects/banglong/settings/environment-variables
- jianlin: (独立项目)

---

## 更新日志

- **2025-12-02**: 创建此文档，记录 Vercel CLI 部署方式
