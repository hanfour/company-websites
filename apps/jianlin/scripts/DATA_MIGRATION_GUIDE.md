# 建林地产数据迁移指南

## 任务目标
从旧网站 https://www.jianlin.com.tw 抓取所有个案资料

## 数据结构

### 1. 热销个案 (Hot Cases)
```typescript
{
  numberID: string;    // 例如: "hot001"
  title: string;       // 标题
  subtitle?: string;   // 副标题
  content?: string;    // HTML 内容
  images?: string[];   // 图片路径数组
  type: 'hot';
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. 历年个案 (History Cases)
```typescript
{
  numberID: string;    // 例如: "history001"
  title: string;
  subtitle?: string;
  content?: string;
  images?: string[];
  type: 'history';
  createdAt?: string;
  updatedAt?: string;
}
```

### 3. 租售物件 (Rentals)
```typescript
{
  numberID: string;    // 例如: "rental001"
  title: string;
  subtitle?: string;
  content?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}
```

## 技术障碍

### 已尝试的方法及失败原因：

1. **Chrome DevTools MCP** ❌
   - 原因：系统未安装 Chrome/Chromium 浏览器
   - 错误：`chrome not found`

2. **Google Sheets API** ❌
   - 原因：旧网站的服务账号 API 已被禁用
   - 错误：`Google Sheets API has not been used in project 123402223995 before or it is disabled`
   - 发现：旧网站数据存储在 Google Sheets (ID: 1UrAXdddpwsWQZ83oE6Utq010xpfpnLkOrQG0riCYMXo)

3. **CloudFront CDN** ❌
   - 原因：所有 JSON 数据文件返回 403 Forbidden
   - CDN URL: `https://d377o53dybsd55.cloudfront.net`

4. **WebFetch 工具** ❌
   - 原因：网站是 React SPA，需要 JavaScript 执行才能加载数据
   - HTML 仅包含空的 `<div id="root"></div>`

## 推荐解决方案

### 方案 1：使用浏览器手动复制（最简单）✅

1. 在浏览器中访问 https://www.jianlin.com.tw
2. 打开浏览器开发者工具 (F12)
3. 切换到 Console 标签
4. 运行以下 JavaScript 代码：

```javascript
// 这段代码会提取页面上显示的所有数据
(async function extractData() {
  // 等待页面加载完成
  await new Promise(resolve => setTimeout(resolve, 3000));

  const hotCases = [];
  const historyCases = [];
  const rentals = [];

  // 根据旧网站的实际 DOM 结构调整选择器
  // 以下是通用示例，需要根据实际情况修改

  // 提取热销个案
  document.querySelectorAll('[data-type="hot"], .hot-case-item').forEach((el, idx) => {
    hotCases.push({
      numberID: `hot${String(idx + 1).padStart(3, '0')}`,
      title: el.querySelector('.title, h2, h3')?.innerText || '',
      subtitle: el.querySelector('.subtitle')?.innerText || '',
      content: el.querySelector('.content, .description')?.innerHTML || '',
      images: Array.from(el.querySelectorAll('img')).map(img => img.src),
      type: 'hot',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // 提取历年个案
  document.querySelectorAll('[data-type="history"], .history-case-item').forEach((el, idx) => {
    historyCases.push({
      numberID: `history${String(idx + 1).padStart(3, '0')}`,
      title: el.querySelector('.title, h2, h3')?.innerText || '',
      subtitle: el.querySelector('.subtitle')?.innerText || '',
      content: el.querySelector('.content, .description')?.innerHTML || '',
      images: Array.from(el.querySelectorAll('img')).map(img => img.src),
      type: 'history',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  // 提取租售物件
  document.querySelectorAll('[data-type="rental"], .rental-item').forEach((el, idx) => {
    rentals.push({
      numberID: `rental${String(idx + 1).padStart(3, '0')}`,
      title: el.querySelector('.title, h2, h3')?.innerText || '',
      subtitle: el.querySelector('.subtitle')?.innerText || '',
      content: el.querySelector('.content, .description')?.innerHTML || '',
      images: Array.from(el.querySelectorAll('img')).map(img => img.src),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  });

  const result = {
    hotCases,
    historyCases,
    rentals
  };

  console.log('提取的数据：', result);

  // 下载为 JSON 文件
  const dataStr = JSON.stringify(result, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'jianlin-data-export.json';
  link.click();

  return result;
})();
```

5. 数据会自动下载为 JSON 文件
6. 将下载的文件放到 `/lib/data/` 目录

### 方案 2：使用 Puppeteer 自动化（需要安装依赖）

如果需要自动化抓取，可以：

```bash
npm install --save-dev puppeteer
```

然后运行自定义脚本（需要根据网站实际结构编写）。

### 方案 3：直接访问 Google Sheets（需要权限）

如果您有旧网站 Google Cloud 项目的访问权限：

1. 访问 https://console.developers.google.com/apis/api/sheets.googleapis.com/overview?project=123402223995
2. 启用 Google Sheets API
3. 重新运行数据抓取脚本：
   ```bash
   node scripts/fetch-old-site-data.js
   ```

## 当前数据状态

现有数据文件位置：
- `/lib/data/case.json` - 包含 1 个测试热销个案
- `/lib/data/rental.json` - 空数组
- `/lib/data/company.json` - 公司信息
- `/lib/data/user.json` - 用户账号

## 数据迁移后的步骤

1. 将抓取的数据保存到对应的 JSON 文件：
   - 热销个案和历年个案 → `/lib/data/case.json`
   - 租售物件 → `/lib/data/rental.json`

2. 图片迁移：
   - 下载所有图片从 CloudFront CDN
   - 上传到新的存储位置
   - 更新 JSON 中的图片路径

3. 验证数据：
   - 运行开发服务器：`npm run dev`
   - 检查所有页面是否正常显示

## 联系与支持

如果遇到问题或需要帮助：
1. 检查浏览器控制台的错误信息
2. 验证 JSON 文件格式是否正确
3. 确认图片路径是否可访问
