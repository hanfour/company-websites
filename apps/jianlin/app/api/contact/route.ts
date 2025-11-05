import { NextRequest, NextResponse } from 'next/server';
import { createAWSEmailService } from '@/lib/email/aws-ses';
import { DefaultEmailTemplate } from '@repo/api-template';
import { createContactMessage } from '@/lib/data/db';

// AWS SES 邮件服务
const emailService = createAWSEmailService();

// 邮件模板
const templateGenerator = new DefaultEmailTemplate(
  '建林工業股份有限公司',
  undefined,
  '#2563eb'
);

// 收件人列表
const receivers = process.env.CONTACT_EMAIL_RECEIVERS?.split(',') || [];

/**
 * POST /api/contact
 * 处理联系表单提交
 * 1. 验证表单数据
 * 2. 保存到 S3
 * 3. 发送邮件通知
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();

    // 验证必要字段
    if (!formData.name || !formData.email || !formData.message) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: '請填寫姓名、Email 和訊息內容' },
        { status: 400 }
      );
    }

    // 验证 Email 格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { error: 'INVALID_EMAIL', message: 'Email 格式不正确' },
        { status: 400 }
      );
    }

    // 1. 保存联系表单到 S3
    const contact = await createContactMessage({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      category: formData.category,
      subject: formData.subject,
      message: formData.message,
    });

    console.log(`[Contact] Saved message ${contact.id} to S3`);

    // 2. 发送邮件通知 (如果配置了收件人)
    if (receivers.length > 0) {
      const htmlContent = templateGenerator.generateHTML(formData);

      const emailResult = await emailService.send({
        to: receivers,
        subject: '建林工業 - 新的聯絡表單通知',
        body: htmlContent,
      });

      if (!emailResult.success) {
        console.error('[Contact] Email send failed:', emailResult.error);
        // 邮件失败不影响表单保存,只记录错误
      } else {
        console.log(`[Contact] Email sent successfully to ${receivers.join(', ')}`);
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: '感謝您的聯絡，我們會盡快回覆',
        contactId: contact.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Contact] Error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: '系統錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
