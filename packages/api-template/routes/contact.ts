import { NextRequest, NextResponse } from 'next/server';

/**
 * 聯絡表單資料介面
 */
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  company?: string;
  captchaId?: string;    // 驗證碼 ID
  captcha?: string;      // 驗證碼答案
  [key: string]: any;    // 允許額外欄位
}

/**
 * 郵件設定介面
 */
export interface EmailConfig {
  subject: string;       // 郵件主旨
}

/**
 * AWS API Gateway 郵件服務介面
 * 使用既有的 AWS API Gateway + Lambda + SES 架構
 */
export interface AWSEmailService {
  send(data: {
    to: string | string[]; // 收件人 email (可以是陣列)
    subject: string;       // 郵件主旨
    body: string;          // HTML 郵件內容
  }): Promise<{ success: boolean; error?: string }>;
}

/**
 * 驗證碼驗證服務介面
 * 必須在後端驗證，前端驗證完全無效
 */
export interface CaptchaService {
  verify(captchaId: string, answer: string): Promise<boolean>;
}

/**
 * HTML 模板生成器介面
 * 每個專案可以客製化自己的郵件模板
 */
export interface EmailTemplateGenerator {
  generateHTML(formData: ContactFormData): string;
}

/**
 * 預設的 HTML 模板生成器（表格式布局，兼容性高）
 * 參考邦瓏建設的實作，使用 table 布局確保各種郵件客戶端正確顯示
 */
export class DefaultEmailTemplate implements EmailTemplateGenerator {
  private companyName: string;
  private companyLogo?: string;
  private primaryColor: string;

  constructor(companyName: string, companyLogo?: string, primaryColor: string = '#1a73e8') {
    this.companyName = companyName;
    this.companyLogo = companyLogo;
    this.primaryColor = primaryColor;
  }

  generateHTML(formData: ContactFormData): string {
    return `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.companyName} - 聯絡表單</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Microsoft JhengHei', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${this.primaryColor}; padding: 30px 40px; text-align: center;">
              ${this.companyLogo ? `
              <img src="${this.companyLogo}" alt="${this.companyName}" style="max-width: 200px; height: auto; margin-bottom: 15px;">
              ` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">新的聯絡表單訊息</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

                <!-- Name -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 12px; color: #666666; margin-bottom: 5px; font-weight: 600;">姓名</div>
                    <div style="font-size: 16px; color: #333333;">${this.escapeHtml(formData.name)}</div>
                  </td>
                </tr>

                <!-- Email -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 12px; color: #666666; margin-bottom: 5px; font-weight: 600;">Email</div>
                    <div style="font-size: 16px; color: #333333;">
                      <a href="mailto:${formData.email}" style="color: ${this.primaryColor}; text-decoration: none;">${this.escapeHtml(formData.email)}</a>
                    </div>
                  </td>
                </tr>

                ${formData.phone ? `
                <!-- Phone -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 12px; color: #666666; margin-bottom: 5px; font-weight: 600;">電話</div>
                    <div style="font-size: 16px; color: #333333;">${this.escapeHtml(formData.phone)}</div>
                  </td>
                </tr>
                ` : ''}

                ${formData.company ? `
                <!-- Company -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 12px; color: #666666; margin-bottom: 5px; font-weight: 600;">公司</div>
                    <div style="font-size: 16px; color: #333333;">${this.escapeHtml(formData.company)}</div>
                  </td>
                </tr>
                ` : ''}

                ${formData.subject ? `
                <!-- Subject -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 12px; color: #666666; margin-bottom: 5px; font-weight: 600;">主旨</div>
                    <div style="font-size: 16px; color: #333333;">${this.escapeHtml(formData.subject)}</div>
                  </td>
                </tr>
                ` : ''}

                <!-- Message -->
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="font-size: 12px; color: #666666; margin-bottom: 5px; font-weight: 600;">訊息內容</div>
                    <div style="font-size: 16px; color: #333333; background-color: #f9f9f9; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${this.escapeHtml(formData.message)}</div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 40px; border-top: 1px solid #eeeeee;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #999999;">此郵件由 ${this.companyName} 網站聯絡表單自動發送</p>
              <p style="margin: 0; font-size: 12px; color: #999999;">送出時間: ${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

/**
 * 建立聯絡表單 API（使用 AWS SES）
 *
 * @param emailService - AWS API Gateway 郵件服務實作
 * @param emailConfig - 郵件設定
 * @param templateGenerator - 郵件模板生成器
 * @param captchaService - 驗證碼驗證服務（選用）
 * @param receiverEmails - 收件人 email 列表或單一 email
 */
export function createContactAPI(
  emailService: AWSEmailService,
  emailConfig: EmailConfig,
  templateGenerator: EmailTemplateGenerator,
  captchaService?: CaptchaService,
  receiverEmails?: string | string[]
) {
  return {
    /**
     * POST /api/contact
     * 處理聯絡表單提交
     */
    async POST(request: NextRequest) {
      try {
        const formData: ContactFormData = await request.json();

        // 驗證必要欄位
        if (!formData.name || !formData.email || !formData.message) {
          return NextResponse.json(
            { error: 'MISSING_FIELDS', message: '請填寫姓名、Email 和訊息' },
            { status: 400 }
          );
        }

        // 驗證 Email 格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          return NextResponse.json(
            { error: 'INVALID_EMAIL', message: 'Email 格式不正確' },
            { status: 400 }
          );
        }

        // 後端驗證驗證碼（如果提供了驗證服務）
        // 開發環境：跳過驗證（因為 Next.js dev 每個 route 有獨立實例，Memory Store 無法共享）
        // 生產環境：正常驗證（Vercel 會重用實例，Memory Store 可以正常運作）
        if (captchaService && formData.captchaId && formData.captcha) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Contact] Development mode: Skipping captcha verification');
          } else {
            const isValid = await captchaService.verify(formData.captchaId, formData.captcha);
            if (!isValid) {
              return NextResponse.json(
                { error: 'INVALID_CAPTCHA', message: '驗證碼錯誤' },
                { status: 400 }
              );
            }
          }
        }

        // 生成郵件內容
        const htmlContent = templateGenerator.generateHTML(formData);

        // 確定收件人
        const recipients = receiverEmails || formData.email;

        // 發送郵件
        const result = await emailService.send({
          to: recipients,
          subject: emailConfig.subject,
          body: htmlContent
        });

        if (!result.success) {
          console.error('Email send failed:', result.error);
          return NextResponse.json(
            { error: 'EMAIL_SEND_FAILED', message: '郵件發送失敗，請稍後再試' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { success: true, message: '感謝您的聯絡，我們會盡快回覆' },
          { status: 200 }
        );
      } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
          { error: 'INTERNAL_ERROR', message: '系統錯誤，請稍後再試' },
          { status: 500 }
        );
      }
    }
  };
}
