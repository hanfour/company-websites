'use client';

import { useState, useEffect } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    category: '-- 其他 --',
    subject: '',
    message: '',
    mathAnswer: '',
    honeypot: '', // Honeypot 欄位（機器人陷阱）
  });

  // 生成簡單數學問題
  const [mathQuestion, setMathQuestion] = useState({ a: 0, b: 0, answer: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // 初始化數學問題
  useEffect(() => {
    generateMathQuestion();
  }, []);

  const generateMathQuestion = () => {
    const a = Math.floor(Math.random() * 10) + 1; // 1-10
    const b = Math.floor(Math.random() * 10) + 1; // 1-10
    setMathQuestion({ a, b, answer: a + b });
  };

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
    setErrorMessage('');

    // Honeypot 檢查（前端）
    if (formData.honeypot) {
      // 機器人填寫了隱藏欄位，靜默拒絕
      setIsSubmitting(false);
      return;
    }

    // 數學問題驗證（前端）
    if (parseInt(formData.mathAnswer) !== mathQuestion.answer) {
      setSubmitStatus('error');
      setErrorMessage('數學問題答案錯誤，請重試');
      setIsSubmitting(false);
      generateMathQuestion(); // 重新生成問題
      setFormData({ ...formData, mathAnswer: '' });
      return;
    }

    try {
      // 调用后端 API (使用 AWS SES)
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          subject: `[${formData.category}] ${formData.subject}`,
          message: formData.message,
          honeypot: formData.honeypot,
          mathAnswer: formData.mathAnswer,
          mathExpected: mathQuestion.answer,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '发送失败');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        phone: '',
        email: '',
        category: '-- 其他 --',
        subject: '',
        message: '',
        mathAnswer: '',
        honeypot: '',
      });
      // 重新生成數學問題
      generateMathQuestion();
    } catch (error: any) {
      console.error('Email send error:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || '發送失敗，請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[1920px] mx-auto">
      {/* 頁面標題 */}
      <div className="w-full text-center py-8 md:py-16">
        <h2 className="text-2xl md:text-3xl font-light text-[#333] mb-4">聯絡我們</h2>
        <h6 className="text-sm md:text-base text-[#666]">收到您的訊息後，我們會盡快安排專人與您聯繫！</h6>
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
                placeholder="Email"
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
                <option value="-- 其他 --">-- 其他 --</option>
                <option value="房屋租賃">房屋租賃</option>
                <option value="房地合建">房地合建</option>
                <option value="土地開發">土地開發</option>
                <option value="購屋諮詢">購屋諮詢</option>
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
                placeholder="主旨"
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
                placeholder="訊息內容"
              />
            </div>

            {/* Honeypot 欄位（機器人陷阱 - 對人類隱藏） */}
            <input
              type="text"
              name="honeypot"
              value={formData.honeypot}
              onChange={handleChange}
              tabIndex={-1}
              autoComplete="off"
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              aria-hidden="true"
            />

            {/* 數學問題驗證 */}
            <div>
              <label htmlFor="mathAnswer" className="block text-sm text-gray-700 mb-2">
                請回答以下問題以驗證您不是機器人：
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-lg font-medium mb-2">
                    {mathQuestion.a} + {mathQuestion.b} = ?
                  </div>
                  <input
                    type="number"
                    id="mathAnswer"
                    name="mathAnswer"
                    value={formData.mathAnswer}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[var(--main-color)] focus:border-[var(--main-color)] transition-all"
                    placeholder="請輸入答案"
                  />
                </div>
              </div>
            </div>

            {/* 錯誤訊息 */}
            {submitStatus === 'error' && errorMessage && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {errorMessage}
              </div>
            )}

            {/* 成功訊息 */}
            {submitStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 text-sm">
                感謝您的聯絡，我們會盡快回覆！
              </div>
            )}

            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[var(--main-color)] text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]"
              >
                {isSubmitting ? '發送中...' : '送出'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
