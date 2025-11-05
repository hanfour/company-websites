'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import emailjs from '@emailjs/browser';

export default function Reservation() {
  const params = useParams();
  const projectName = decodeURIComponent(params.projectName as string);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    category: projectName || '-- 其他 --',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // 当 projectName 更新时更新 category
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      category: projectName || '-- 其他 --'
    }));
  }, [projectName]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
      const userId = process.env.NEXT_PUBLIC_EMAILJS_USER_ID || '';

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_name: formData.name,
          from_email: formData.email,
          phone: formData.phone,
          category: formData.category,
          subject: formData.subject,
          message: formData.message,
        },
        userId
      );

      setSubmitStatus('success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        category: projectName || '-- 其他 --',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error('Email send error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 頁面標題 */}
      <div className="w-full text-center py-8 md:py-16">
        <h2 className="text-2xl md:text-3xl font-light text-[#333] mb-4">
          預約賞屋 - {projectName}
        </h2>
        <h6 className="text-sm md:text-base text-[#666]">
          收到您的訊息後，我們會盡快安排專人與您聯繫！
        </h6>
      </div>

      {/* 聯絡表單 */}
      <div className="w-full max-w-[91.666667%] md:max-w-[66.666667%] mx-auto pb-8 md:pb-12">
        <div className="bg-white p-6 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all"
                placeholder="姓名"
              />
            </div>

            <div>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all"
                placeholder="聯絡電話"
              />
            </div>

            <div>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all"
                placeholder="聯絡信箱"
              />
            </div>

            <div>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all bg-white"
              >
                <option value={projectName}>{projectName}</option>
                <option value="新竹之昇">新竹之昇</option>
                <option value="時光織錦">時光織錦</option>
                <option value="租售相關">租售相關</option>
                <option value="-- 其他 --">-- 其他 --</option>
              </select>
            </div>

            <div>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all"
                placeholder="洽詢主旨"
              />
            </div>

            <div>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all resize-none"
                placeholder="洽詢內容"
              />
            </div>

            {/* 提交按鈕 */}
            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-12 py-4 bg-[var(--main-color)] text-white text-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '傳送中...' : 'SUBMIT'}
              </button>
            </div>

            {/* 狀態訊息 */}
            {submitStatus === 'success' && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 text-center">
                感謝您的來信！我們將盡快回覆您。
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 text-center">
                發送失敗，請稍後再試或直接撥打電話聯繫我們。
              </div>
            )}
          </form>
        </div>
      </div>

    </div>
  );
}
