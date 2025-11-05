import {
  createContactAPI,
  DefaultEmailTemplate,
  createCaptchaVerifier
} from '@repo/api-template';
import { createAWSEmailService } from '@/lib/email/aws-ses';
import { createMemoryCaptchaStore } from '@/lib/captcha/memory-store';

// AWS SES 郵件服務
const emailService = createAWSEmailService();

// 郵件設定
const emailConfig = {
  subject: '建林工業 - 新的聯絡表單訊息'
};

// 郵件模板（使用建林工業的品牌色）
const templateGenerator = new DefaultEmailTemplate(
  '建林工業股份有限公司',
  undefined, // Logo URL（可選）
  '#2563eb'  // 建林工業主色調（藍色）
);

// 驗證碼驗證服務（使用 Memory Store - 零依賴）
const captchaStore = createMemoryCaptchaStore();
const captchaService = createCaptchaVerifier(captchaStore);

// 收件人列表（從環境變數讀取）
const receivers = process.env.CONTACT_EMAIL_RECEIVERS?.split(',') || [];

if (receivers.length === 0) {
  console.warn('CONTACT_EMAIL_RECEIVERS not configured. Contact form will not work properly.');
}

// 建立聯絡表單 API
const api = createContactAPI(
  emailService,
  emailConfig,
  templateGenerator,
  captchaService, // 使用驗證碼驗證
  receivers
);

// 匯出 POST 方法
export const POST = api.POST;
