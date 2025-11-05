import type { CaptchaStore } from '@repo/api-template';

/**
 * Memory Captcha Store（記憶體驗證碼儲存）
 *
 * ⚠️ Serverless 環境注意事項：
 * 1. 在 Vercel/AWS Lambda 等 Serverless 環境中，每個請求可能在不同的實例上執行
 * 2. 全域變數在同一實例內會保留，但不保證在不同請求間共享
 * 3. 這對驗證碼來說是可接受的：
 *    - 生成驗證碼和驗證驗證碼通常在相近時間內發生
 *    - Vercel 會盡量將相近的請求路由到同一實例
 *    - 即使偶爾失敗，使用者只需重新載入驗證碼
 *
 * 優點：
 * - 零成本（不需要外部服務）
 * - 零配置（不需要環境變數）
 * - 適合低到中等流量網站
 *
 * 缺點：
 * - 在高流量或多實例環境下可能有 5-10% 的驗證失敗率
 * - 伺服器重啟後所有驗證碼會遺失
 *
 * 如果驗證失敗率過高，建議升級到 Vercel KV 或 Upstash Redis
 */

interface CaptchaData {
  code: string;
  expiresAt: number;
  attempts: number; // 嘗試次數（防止暴力破解）
}

// 全域 Map，在同一 Serverless 實例內共享
const captchaMap = new Map<string, CaptchaData>();

// 用於識別不同的 Serverless 實例
const instanceId = Math.random().toString(36).substring(7);
console.log(`[Captcha] Memory Store initialized - Instance ID: ${instanceId}`);

// 清理過期驗證碼（每 5 分鐘執行一次）
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return; // 避免重複啟動

  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;

    for (const [id, data] of captchaMap.entries()) {
      if (data.expiresAt < now) {
        captchaMap.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Captcha] Cleaned ${cleaned} expired captchas. Remaining: ${captchaMap.size}`);
    }
  }, 300000); // 5 分鐘

  // 確保 Node.js 不會因為這個定時器而保持運行
  cleanupInterval.unref();
}

export function createMemoryCaptchaStore(): CaptchaStore {
  // 啟動清理定時器
  startCleanup();

  return {
    async set(id: string, code: string, expiresIn: number = 600) {
      captchaMap.set(id, {
        code,
        expiresAt: Date.now() + expiresIn * 1000,
        attempts: 0
      });

      console.log(`[Captcha:${instanceId}] Created: ${id} (code: ${code}, expires in ${expiresIn}s, total: ${captchaMap.size})`);
    },

    async getAndDelete(id: string) {
      const data = captchaMap.get(id);

      if (!data) {
        console.log(`[Captcha:${instanceId}] Not found: ${id} (total in store: ${captchaMap.size})`);
        return null;
      }

      // 檢查是否過期
      if (data.expiresAt < Date.now()) {
        captchaMap.delete(id);
        console.log(`[Captcha] Expired: ${id}`);
        return null;
      }

      // 檢查嘗試次數（防止暴力破解，最多允許 3 次）
      data.attempts++;
      if (data.attempts > 3) {
        captchaMap.delete(id);
        console.log(`[Captcha] Too many attempts: ${id}`);
        return null;
      }

      // 如果這是第 3 次嘗試，無論對錯都刪除
      if (data.attempts === 3) {
        const code = data.code;
        captchaMap.delete(id);
        console.log(`[Captcha:${instanceId}] Final attempt: ${id}`);
        return code;
      }

      // 前兩次嘗試不刪除，允許重試
      console.log(`[Captcha:${instanceId}] Attempt ${data.attempts}: ${id}`);
      return data.code;
    }
  };
}

/**
 * 取得當前儲存的驗證碼數量（用於監控）
 */
export function getCaptchaStoreStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const data of captchaMap.values()) {
    if (data.expiresAt >= now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total: captchaMap.size,
    active,
    expired
  };
}
