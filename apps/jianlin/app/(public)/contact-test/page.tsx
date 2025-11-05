'use client';

import { useState } from 'react';

export default function ContactTestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    captcha: ''
  });

  const [captchaId, setCaptchaId] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [responseData, setResponseData] = useState<any>(null);

  // 載入驗證碼（暫時省略，因為還沒有 Vercel KV）
  const loadCaptcha = async () => {
    try {
      const response = await fetch('/api/captcha');
      const data = await response.json();

      if (data.success) {
        setCaptchaId(data.captchaId);
        alert(`驗證碼 ID: ${data.captchaId}\n(請記住這個 ID，稍後需要手動輸入驗證碼)`);
      } else {
        alert('驗證碼載入失敗：' + JSON.stringify(data));
      }
    } catch (error: any) {
      alert('驗證碼載入錯誤：' + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');
    setResponseData(null);

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
      setResponseData(result);

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', phone: '', message: '', captcha: '' });
      } else {
        setStatus('error');
        setErrorMessage(result.message || '發送失敗');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage('網路錯誤：' + error.message);
      setResponseData({ error: error.message });
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-5 font-sans">
      <h1 className="text-2xl font-bold mb-6">聯絡表單測試頁面</h1>

      <div className="bg-yellow-100 p-4 mb-5 rounded">
        <strong>注意：</strong>
        <ul className="list-disc pl-5 mt-2">
          <li>這是測試頁面，用於驗證 API 功能</li>
          <li>驗證碼功能需要 Vercel KV，目前會報錯（正常）</li>
          <li>可以先不填驗證碼測試表單提交</li>
        </ul>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block mb-1 font-bold">姓名 *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full p-2.5 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full p-2.5 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">電話</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full p-2.5 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">訊息 *</label>
          <textarea
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            required
            rows={5}
            className="w-full p-2.5 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block mb-1 font-bold">驗證碼（選填）</label>
          <button
            type="button"
            onClick={loadCaptcha}
            className="px-4 py-2 mb-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded cursor-pointer transition-colors"
          >
            載入驗證碼
          </button>
          <input
            type="text"
            value={formData.captcha}
            onChange={(e) => setFormData({ ...formData, captcha: e.target.value })}
            placeholder="請輸入驗證碼"
            className="w-full p-2.5 border border-gray-300 rounded"
          />
          {captchaId && (
            <div className="mt-1 text-xs text-gray-600">
              驗證碼 ID: {captchaId}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'sending'}
          className={`p-3 text-white rounded text-base transition-colors ${
            status === 'sending'
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          }`}
        >
          {status === 'sending' ? '發送中...' : '送出'}
        </button>
      </form>

      {status === 'success' && (
        <div className="mt-5 p-4 bg-green-100 text-green-800 rounded">
          ✅ 發送成功！感謝您的聯絡，我們會盡快回覆。
        </div>
      )}

      {status === 'error' && (
        <div className="mt-5 p-4 bg-red-100 text-red-800 rounded">
          ❌ 發送失敗：{errorMessage}
        </div>
      )}

      {responseData && (
        <details className="mt-5 p-4 bg-gray-50 rounded">
          <summary className="cursor-pointer font-bold">查看 API 回應</summary>
          <pre className="mt-2.5 overflow-auto">
            {JSON.stringify(responseData, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
