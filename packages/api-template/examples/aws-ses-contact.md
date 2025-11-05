# AWS SES 聯絡表單實作範例

> 本文件基於邦瓏建設專案的實作，修正了所有設計缺陷

## 架構概覽

```
前端表單 (React)
  ↓ POST /api/contact
後端 API (Next.js)
  ├─ 驗證驗證碼 (Redis)
  ├─ 驗證表單資料 (Zod)
  └─ 發送郵件 ↓
AWS API Gateway (https://api.miilink.net/send)
  ↓
Lambda 函數
  ↓
Amazon SES
  ↓
收件人信箱
```

---

## 步驟 1: 環境變數設定

在 `apps/jianlin/.env.local` 新增：

```env
# AWS API Gateway 設定（注意：不要用 VITE_ 前綴！）
API_GATEWAY_URL=https://your-api-gateway-url.amazonaws.com/send
API_GATEWAY_API_KEY=your-api-gateway-key-here

# 聯絡表單收件人（可以是多個，用逗號分隔）
CONTACT_EMAIL_RECEIVERS=your-email@example.com

# Vercel KV (Redis) - 用於驗證碼儲存
# 在 Vercel Dashboard 建立 KV 存儲後會自動注入這些變數
KV_URL=***
KV_REST_API_URL=***
KV_REST_API_TOKEN=***
KV_REST_API_READ_ONLY_TOKEN=***
```

---

## 步驟 2: 安裝必要套件

```bash
cd /Users/hanfourhuang/Projects/company-websites/apps/jianlin

# Axios - 調用 AWS API Gateway
npm install axios

# Vercel KV - Redis 儲存（驗證碼）
npm install @vercel/kv

# UUID - 生成驗證碼 ID
npm install uuid
npm install --save-dev @types/uuid
```

---

## 步驟 3: 建立 AWS Email Service 實作

建立 `apps/jianlin/lib/email/aws-ses.ts`：

```typescript
import axios from 'axios';
import type { AWSEmailService } from '@repo/api-template';

export function createAWSEmailService(): AWSEmailService {
  const apiGatewayUrl = process.env.API_GATEWAY_URL;
  const apiKey = process.env.API_GATEWAY_API_KEY;

  if (!apiGatewayUrl || !apiKey) {
    throw new Error('Missing AWS API Gateway configuration');
  }

  return {
    async send(data) {
      try {
        const response = await axios.post(
          apiGatewayUrl,
          {
            to: Array.isArray(data.to) ? data.to : [data.to],
            subject: data.subject,
            body: data.body
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
              'x-api-key': apiKey
            },
            timeout: 10000 // 10 秒逾時
          }
        );

        if (response.status === 200) {
          return { success: true };
        } else {
          return { success: false, error: `HTTP ${response.status}` };
        }
      } catch (error: any) {
        console.error('AWS SES send failed:', error.response?.data || error.message);
        return {
          success: false,
          error: error.response?.data?.message || error.message
        };
      }
    }
  };
}
```

---

## 步驟 4: 建立 Vercel KV 驗證碼儲存

建立 `apps/jianlin/lib/captcha/vercel-kv-store.ts`：

```typescript
import { kv } from '@vercel/kv';
import type { CaptchaStore } from '@repo/api-template';

export function createVercelKVCaptchaStore(): CaptchaStore {
  return {
    async set(id: string, code: string, expiresIn: number = 600) {
      await kv.set(`captcha:${id}`, code, { ex: expiresIn });
    },

    async getAndDelete(id: string) {
      const key = `captcha:${id}`;
      const code = await kv.get<string>(key);

      if (code) {
        // 刪除驗證碼（一次性使用）
        await kv.del(key);
      }

      return code;
    }
  };
}
```

---

## 步驟 5: 建立驗證碼 API

建立 `apps/jianlin/app/api/captcha/route.ts`：

```typescript
import { v4 as uuidv4 } from 'uuid';
import {
  createCaptchaAPI,
  DefaultCaptchaGenerator
} from '@repo/api-template';
import { createVercelKVCaptchaStore } from '@/lib/captcha/vercel-kv-store';

// 初始化驗證碼儲存
const store = createVercelKVCaptchaStore();

// 初始化驗證碼生成器
const generator = new DefaultCaptchaGenerator();

// 建立 API
const api = createCaptchaAPI(store, generator, uuidv4);

export const GET = api.GET;
```

**重要改進：**
- ✅ 不回傳 `captchaText`（邦瓏建設的致命錯誤）
- ✅ 使用 Vercel KV 而非全域變數
- ✅ 驗證碼一次性使用（getAndDelete）
- ✅ 自動過期（10 分鐘）

---

## 步驟 6: 建立聯絡表單 API

建立 `apps/jianlin/app/api/contact/route.ts`：

```typescript
import {
  createContactAPI,
  DefaultEmailTemplate,
  createCaptchaVerifier
} from '@repo/api-template';
import { createAWSEmailService } from '@/lib/email/aws-ses';
import { createVercelKVCaptchaStore } from '@/lib/captcha/vercel-kv-store';

// AWS SES 郵件服務
const emailService = createAWSEmailService();

// 郵件設定
const emailConfig = {
  subject: '建林工業 - 新的聯絡表單訊息'
};

// 郵件模板
const templateGenerator = new DefaultEmailTemplate(
  '建林工業股份有限公司',
  'https://www.jianlin.com.tw/logo.png', // Logo URL
  '#1a73e8' // 主色調
);

// 驗證碼驗證服務
const captchaStore = createVercelKVCaptchaStore();
const captchaService = createCaptchaVerifier(captchaStore);

// 收件人列表
const receivers = process.env.CONTACT_EMAIL_RECEIVERS?.split(',') || ['default@example.com'];

// 建立 API
const api = createContactAPI(
  emailService,
  emailConfig,
  templateGenerator,
  captchaService, // 傳入驗證服務，API 會自動驗證
  receivers
);

export const POST = api.POST;
```

**關鍵改進：**
- ✅ 後端驗證驗證碼（不依賴前端）
- ✅ 模板化設計，易於多專案複用
- ✅ 支援多個收件人
- ✅ 一個 API 搞定所有邏輯（不需要分開調用 sendEmail）

---

## 步驟 7: 前端實作（修正版）

建立 `apps/jianlin/app/(public)/contact/page.tsx`：

```typescript
'use client';

import { useState, useEffect } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    captcha: ''
  });

  const [captchaId, setCaptchaId] = useState<string>('');
  const [captchaImage, setCaptchaImage] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 載入驗證碼
  const loadCaptcha = async () => {
    try {
      const response = await fetch('/api/captcha');
      const data = await response.json();

      if (data.success) {
        setCaptchaId(data.captchaId);
        setCaptchaImage(data.captchaImage || '');
      }
    } catch (error) {
      console.error('Load captcha failed:', error);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          captchaId
        })
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '', captcha: '' });
        loadCaptcha(); // 重新載入驗證碼
      } else {
        setStatus('error');
        setErrorMessage(result.message || '發送失敗');
        if (result.error === 'INVALID_CAPTCHA') {
          loadCaptcha(); // 驗證碼錯誤，重新載入
        }
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('網路錯誤，請稍後再試');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">聯絡我們</h1>

      <form onSubmit={handleSubmit} className="max-w-md space-y-4">
        <div>
          <label className="block mb-2">姓名 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">電話</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">訊息 *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={5}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">驗證碼 *</label>
          {captchaImage && (
            <img
              src={captchaImage}
              alt="驗證碼"
              className="mb-2 cursor-pointer"
              onClick={loadCaptcha}
              title="點擊重新載入"
            />
          )}
          <input
            type="text"
            value={formData.captcha}
            onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
            required
            placeholder="請輸入驗證碼"
            className="w-full p-2 border rounded"
          />
          <button
            type="button"
            onClick={loadCaptcha}
            className="text-sm text-blue-600 mt-1"
          >
            重新載入驗證碼
          </button>
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {status === 'sending' ? '發送中...' : '送出'}
        </button>

        {status === 'success' && (
          <div className="p-4 bg-green-100 text-green-800 rounded">
            感謝您的聯絡，我們會盡快回覆！
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 bg-red-100 text-red-800 rounded">
            {errorMessage}
          </div>
        )}
      </form>
    </div>
  );
}
```

**關鍵改進：**
- ✅ 不在前端驗證驗證碼（移除邦瓏建設的無用驗證）
- ✅ 驗證碼錯誤時自動重新載入
- ✅ 只調用一個 API（`/api/contact`），簡化流程
- ✅ 不會看到驗證碼答案（安全）

---

## 步驟 8: 使用 Canvas 驗證碼（選用）

如果你想在伺服器端生成驗證碼圖片（像邦瓏建設一樣），需要安裝 canvas 套件：

```bash
npm install canvas
```

然後修改 `app/api/captcha/route.ts`：

```typescript
import { CanvasCaptchaGenerator } from '@repo/api-template';

// 使用 Canvas 生成器（會生成圖片）
const generator = new CanvasCaptchaGenerator();
```

**注意：** 在 Vercel 部署時，需要配置 `next.config.js`：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允許使用 canvas 套件
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
```

---

## 步驟 9: 自訂郵件模板（選用）

如果預設模板不符合需求，可以自訂：

建立 `apps/jianlin/lib/email/template.ts`：

```typescript
import type { EmailTemplateGenerator, ContactFormData } from '@repo/api-template';

export class JianlinEmailTemplate implements EmailTemplateGenerator {
  generateHTML(formData: ContactFormData): string {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: 'Microsoft JhengHei', Arial, sans-serif;">
  <table role="presentation" width="600" style="margin: 0 auto; background: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0;">建林工業</h1>
        <p style="color: #ffffff; margin: 10px 0 0 0;">新的聯絡表單訊息</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 30px;">
        <p><strong>姓名：</strong>${this.escapeHtml(formData.name)}</p>
        <p><strong>Email：</strong><a href="mailto:${formData.email}">${this.escapeHtml(formData.email)}</a></p>
        ${formData.phone ? `<p><strong>電話：</strong>${this.escapeHtml(formData.phone)}</p>` : ''}
        <hr>
        <p><strong>訊息內容：</strong></p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">
          ${this.escapeHtml(formData.message)}
        </div>
      </td>
    </tr>
    <tr>
      <td style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #999;">
        <p>此郵件由建林工業網站自動發送</p>
        <p>送出時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
```

然後在 `app/api/contact/route.ts` 中使用：

```typescript
import { JianlinEmailTemplate } from '@/lib/email/template';

const templateGenerator = new JianlinEmailTemplate();
```

---

## 與邦瓏建設專案的比較

| 項目 | 邦瓏建設（有缺陷） | 新架構（已修正） |
|------|------------------|-----------------|
| 驗證碼驗證位置 | 前端 ❌ | 後端 ✅ |
| 驗證碼答案洩漏 | 回傳給前端 ❌ | 不回傳 ✅ |
| 驗證碼儲存 | 全域變數 ❌ | Vercel KV (Redis) ✅ |
| API 調用次數 | 2 次（contact + sendEmail） ❌ | 1 次 ✅ |
| 環境變數命名 | VITE_ 前綴 ❌ | 正確命名 ✅ |
| 郵件模板 | 散落各處 ❌ | 統一模板化 ✅ |
| 多專案複用 | 困難 ❌ | 簡單 ✅ |

---

## 部署到 Vercel

1. **建立 Vercel KV 存儲：**
   - 前往 Vercel Dashboard
   - Storage → Create Database → KV (Redis)
   - 選擇專案並連結

2. **環境變數會自動注入：**
   ```
   KV_URL
   KV_REST_API_URL
   KV_REST_API_TOKEN
   KV_REST_API_READ_ONLY_TOKEN
   ```

3. **手動新增其他環境變數：**
   ```
   API_GATEWAY_URL=https://api.miilink.net/send
   API_GATEWAY_API_KEY=***
   CONTACT_EMAIL_RECEIVERS=sales@jianlin.com.tw
   ```

4. **部署：**
   ```bash
   git add .
   git commit -m "Add contact form with AWS SES"
   git push
   ```

---

## 測試

### 本地測試

```bash
# 啟動開發伺服器
npm run dev

# 1. 測試驗證碼生成
curl http://localhost:3000/api/captcha

# 回應：
# {
#   "success": true,
#   "captchaId": "123e4567-e89b-12d3-a456-426614174000",
#   "captchaImage": "data:image/png;base64,..."
# }

# 2. 測試聯絡表單（驗證碼錯誤）
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張三",
    "email": "test@example.com",
    "message": "測試訊息",
    "captchaId": "123e4567-e89b-12d3-a456-426614174000",
    "captcha": "WRONG"
  }'

# 回應：
# {
#   "error": "INVALID_CAPTCHA",
#   "message": "驗證碼錯誤"
# }

# 3. 測試聯絡表單（正確）
# 從步驟 1 取得 captchaImage，看圖片中的驗證碼
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "張三",
    "email": "test@example.com",
    "message": "測試訊息",
    "captchaId": "123e4567-e89b-12d3-a456-426614174000",
    "captcha": "4A7X"
  }'

# 回應：
# {
#   "success": true,
#   "message": "感謝您的聯絡，我們會盡快回覆"
# }
```

### 檢查郵件

前往 `CONTACT_EMAIL_RECEIVERS` 設定的信箱，確認是否收到郵件。

---

## 常見問題

### Q1: Vercel KV 要錢嗎？
**A:** 免費方案包含：
- 256 MB 存儲
- 3,000 次請求/天
- 對於驗證碼功能綽綽有餘

### Q2: 如果不想用 Vercel KV 怎麼辦？
**A:** 可以用 Upstash Redis（也有免費方案）：

```bash
npm install @upstash/redis
```

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function createUpstashCaptchaStore(): CaptchaStore {
  return {
    async set(id, code, expiresIn = 600) {
      await redis.set(`captcha:${id}`, code, { ex: expiresIn });
    },
    async getAndDelete(id) {
      const code = await redis.get<string>(`captcha:${id}`);
      if (code) await redis.del(`captcha:${id}`);
      return code;
    }
  };
}
```

### Q3: AWS API Gateway 可以換成其他服務嗎？
**A:** 可以！只需實作 `AWSEmailService` 介面即可：

```typescript
// 例如：改用 Resend
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const emailService: AWSEmailService = {
  async send(data) {
    const result = await resend.emails.send({
      from: 'contact@jianlin.com',
      to: data.to,
      subject: data.subject,
      html: data.body
    });
    return { success: !result.error };
  }
};
```

### Q4: 不想要驗證碼怎麼辦？
**A:** 在建立 API 時不傳入 `captchaService`：

```typescript
const api = createContactAPI(
  emailService,
  emailConfig,
  templateGenerator,
  undefined, // 不使用驗證碼
  receivers
);
```

---

## 總結

這個新架構修正了邦瓏建設專案的所有設計缺陷：

1. ✅ **安全性提升** - 驗證碼在後端驗證，無法繞過
2. ✅ **架構簡化** - 一個 API 搞定所有邏輯
3. ✅ **可維護性** - 模板化設計，易於多專案複用
4. ✅ **生產就緒** - 使用可靠的儲存服務（Redis）
5. ✅ **零破壞性** - 完全向後兼容，可逐步遷移

**下一步：** 在建林專案中實作這套架構！
