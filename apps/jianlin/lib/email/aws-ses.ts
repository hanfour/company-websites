import axios from 'axios';
import https from 'https';
import type { AWSEmailService } from '@repo/api-template';

/**
 * 建立 AWS SES Email Service
 * 使用既有的 AWS API Gateway + Lambda + SES 架構
 */
export function createAWSEmailService(): AWSEmailService {
  return {
    async send(data) {
      // 延遲檢查環境變數到實際使用時（避免構建時錯誤）
      const apiGatewayUrl = process.env.API_GATEWAY_URL;
      const apiKey = process.env.API_GATEWAY_API_KEY;

      if (!apiGatewayUrl || !apiKey) {
        console.error('[AWS SES] Missing configuration: API_GATEWAY_URL or API_GATEWAY_API_KEY');
        return {
          success: false,
          error: 'Email service not configured'
        };
      }
      try {
        // 開發環境：允許自簽憑證（用於測試）
        // 生產環境：正常驗證 SSL 憑證
        const httpsAgent = process.env.NODE_ENV === 'development'
          ? new https.Agent({ rejectUnauthorized: false })
          : undefined;

        if (httpsAgent) {
          console.log('[AWS SES] Development mode: Disabling SSL certificate verification');
        }

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
            timeout: 10000, // 10 秒逾時
            httpsAgent
          }
        );

        if (response.status === 200) {
          return { success: true };
        } else {
          return {
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`
          };
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
