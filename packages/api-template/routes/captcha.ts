import { NextRequest, NextResponse } from 'next/server';

/**
 * 驗證碼儲存介面
 *
 * ⚠️ 重要：不要使用全域變數！
 * 在 Serverless 環境（Vercel、AWS Lambda）中，全域變數會在不同請求間共享，
 * 但無法保證一致性，甚至可能在不同實例間丟失。
 *
 * 建議使用：
 * - Vercel KV (Redis)
 * - Upstash Redis
 * - AWS DynamoDB
 * - 任何可靠的 Key-Value 存儲
 */
export interface CaptchaStore {
  /**
   * 儲存驗證碼
   * @param id 驗證碼 ID
   * @param code 驗證碼文字
   * @param expiresIn 過期時間（秒），預設 600 秒（10 分鐘）
   */
  set(id: string, code: string, expiresIn?: number): Promise<void>;

  /**
   * 取得並刪除驗證碼（一次性使用）
   * @param id 驗證碼 ID
   * @returns 驗證碼文字，如果不存在或已過期則返回 null
   */
  getAndDelete(id: string): Promise<string | null>;
}

/**
 * 驗證碼生成器介面
 */
export interface CaptchaGenerator {
  /**
   * 生成驗證碼文字
   * @param length 長度，預設 4
   */
  generate(length?: number): string;

  /**
   * 生成驗證碼圖片（base64 PNG）
   * @param code 驗證碼文字
   * @param width 寬度，預設 100
   * @param height 高度，預設 50
   */
  generateImage?(code: string, width?: number, height?: number): string;
}

/**
 * 預設驗證碼生成器（數字+大寫字母，排除易混淆字元）
 */
export class DefaultCaptchaGenerator implements CaptchaGenerator {
  // 排除 0/O, 1/I/l, 2/Z 等易混淆字元
  private readonly chars = '3456789ABCDEFGHJKLMNPQRSTUVWXY';

  generate(length: number = 4): string {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += this.chars.charAt(Math.floor(Math.random() * this.chars.length));
    }
    return code;
  }
}

/**
 * 建立驗證碼 API
 *
 * @param store 驗證碼儲存服務
 * @param generator 驗證碼生成器
 * @param idGenerator ID 生成器（建議使用 uuid v4）
 */
export function createCaptchaAPI(
  store: CaptchaStore,
  generator: CaptchaGenerator,
  idGenerator: () => string
) {
  return {
    /**
     * GET /api/captcha
     * 生成新的驗證碼
     *
     * ⚠️ 安全設計：不回傳驗證碼文字，只回傳 ID
     * 前端無法得知答案，必須由使用者輸入後在後端驗證
     */
    async GET() {
      try {
        const code = generator.generate();
        const captchaId = idGenerator();

        // 儲存驗證碼（10 分鐘過期）
        await store.set(captchaId, code, 600);

        // ✅ 正確：只回傳 ID，不回傳答案
        const response: Record<string, any> = {
          success: true,
          captchaId,
          // 如果 generator 支援圖片生成，則回傳圖片
          captchaImage: generator.generateImage ? generator.generateImage(code) : undefined
        };

        // 🚧 開發模式：顯示驗證碼文字（僅用於測試）
        if (process.env.NODE_ENV === 'development') {
          response.captchaCode = code;
          response._devNote = '⚠️ 此欄位僅在開發環境顯示，生產環境不會回傳';
        }

        return NextResponse.json(response);
      } catch (error) {
        console.error('Generate captcha error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '生成驗證碼失敗' },
          { status: 500 }
        );
      }
    }
  };
}

/**
 * 建立驗證碼驗證服務
 *
 * @param store 驗證碼儲存服務
 * @returns 驗證服務實例
 */
export function createCaptchaVerifier(store: CaptchaStore) {
  return {
    /**
     * 驗證驗證碼
     * @param captchaId 驗證碼 ID
     * @param answer 使用者輸入的答案
     * @returns 是否正確
     */
    async verify(captchaId: string, answer: string): Promise<boolean> {
      if (!captchaId || !answer) {
        return false;
      }

      try {
        // 從儲存中取得並刪除（一次性使用）
        const storedCode = await store.getAndDelete(captchaId);

        if (!storedCode) {
          // 驗證碼不存在或已過期
          return false;
        }

        // 不區分大小寫比較
        return storedCode.toUpperCase() === answer.toUpperCase();
      } catch (error) {
        console.error('Verify captcha error:', error);
        return false;
      }
    }
  };
}

/**
 * Canvas 驗證碼圖片生成器（適用於 Node.js 環境）
 *
 * ⚠️ 已棄用：此類別需要 canvas 原生模組，在 Serverless 環境中不可用
 * 建議使用第三方圖片驗證碼服務（如 Google reCAPTCHA, hCaptcha）
 * 或使用數學問題 + Honeypot 等替代方案
 *
 * @deprecated Use math questions or third-party CAPTCHA services instead
 */
export class CanvasCaptchaGenerator extends DefaultCaptchaGenerator {
  generateImage(code: string, width: number = 100, height: number = 50): string {
    throw new Error(
      'CanvasCaptchaGenerator is not supported in Serverless environments. ' +
      'Please use third-party CAPTCHA services (Google reCAPTCHA, hCaptcha) ' +
      'or alternative solutions like math questions.'
    );
  }
}
