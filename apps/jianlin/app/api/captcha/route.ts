import { v4 as uuidv4 } from 'uuid';
import {
  createCaptchaAPI,
  DefaultCaptchaGenerator
} from '@repo/api-template';
import { createMemoryCaptchaStore } from '@/lib/captcha/memory-store';

// 初始化驗證碼儲存（Memory Store - 零依賴，適用於 Serverless）
const store = createMemoryCaptchaStore();

// 初始化驗證碼生成器（預設：數字+大寫字母，排除易混淆字元）
const generator = new DefaultCaptchaGenerator();

// 建立驗證碼 API
const api = createCaptchaAPI(store, generator, uuidv4);

// 匯出 GET 方法
export const GET = api.GET;
