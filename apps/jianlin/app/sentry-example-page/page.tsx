"use client";

import * as Sentry from "@sentry/nextjs";

export default function Page() {
  return (
    <div>
      <main className="min-h-screen flex flex-col justify-center items-center text-lg font-sans">
        <h1 className="text-3xl mb-4">
          Sentry 測試頁面
        </h1>
        <p className="mb-4">
          點擊按鈕發送測試錯誤到 Sentry：
        </p>

        <div className="flex gap-4 mb-8">
          <button
            type="button"
            className="px-6 py-3 text-base bg-purple-700 hover:bg-purple-800 text-white rounded cursor-pointer transition-colors"
            onClick={() => {
              // Sentry 推薦的測試方法：調用未定義的函數
              // @ts-ignore
              myUndefinedFunction();
            }}
          >
            測試錯誤 1 (未定義函數)
          </button>

          <button
            type="button"
            className="px-6 py-3 text-base bg-blue-700 hover:bg-blue-800 text-white rounded cursor-pointer transition-colors"
            onClick={() => {
              Sentry.captureException(new Error("手動測試錯誤 - Sentry Integration Test"));
              alert("測試錯誤已發送！請檢查瀏覽器 Console 和 Sentry Dashboard");
            }}
          >
            測試錯誤 2 (手動捕獲)
          </button>

          <button
            type="button"
            className="px-6 py-3 text-base bg-pink-700 hover:bg-pink-800 text-white rounded cursor-pointer transition-colors"
            onClick={() => {
              Sentry.captureMessage("測試訊息 - Sentry Message Test", "info");
              alert("測試訊息已發送！請檢查瀏覽器 Console");
            }}
          >
            測試訊息
          </button>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg max-w-2xl text-sm">
          <p className="mb-2 font-bold">
            測試說明：
          </p>
          <ul className="text-left leading-relaxed space-y-1">
            <li>打開瀏覽器的 Developer Console (F12) 查看 Sentry debug 訊息</li>
            <li>點擊任一按鈕觸發測試</li>
            <li>檢查 Console 是否有 Sentry 發送事件的日誌</li>
            <li>前往 Sentry Dashboard 確認事件已被接收</li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-gray-600">
          查看錯誤報告：{" "}
          <a
            href="https://hanfourhuang.sentry.io/issues/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 underline hover:text-purple-800"
          >
            Sentry Issues Page
          </a>
        </p>

        <p className="mt-4 text-xs text-gray-500">
          更多資訊：{" "}
          <a
            href="https://docs.sentry.io/platforms/javascript/guides/nextjs/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-700 underline hover:text-purple-800"
          >
            Sentry Next.js 文檔
          </a>
        </p>
      </main>
    </div>
  );
}
