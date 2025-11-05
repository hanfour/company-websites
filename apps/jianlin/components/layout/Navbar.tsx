'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(true);

  const toggleNavbar = () => setCollapsed(!collapsed);

  // 控制 body scroll 鎖定
  useEffect(() => {
    if (!collapsed) {
      // 選單打開時，鎖定 body 滾動
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // 選單關閉時，解除鎖定
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // 清理函數
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [collapsed]);

  // 禁用右鍵選單
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <>
      {/* 漢堡選單覆蓋層 */}
      <div id="menu-layout" className={collapsed ? '' : 'open'}>
        <div className="max-w-[91.666667%] mx-auto px-0">
            {/* Logo 區域 (隱藏但佔位) */}
            <nav className="flex items-center justify-end w-full px-0 py-1 md:py-3">
              <div className="mr-auto">
                <Image
                  src="/logo.svg"
                  alt="建林工業"
                  width={200}
                  height={60}
                  className="w-full max-w-[200px] opacity-0"
                />
              </div>
              <div
                id="nav-button"
                className={collapsed ? 'border-gray' : 'open border-gray'}
                onClick={toggleNavbar}
              >
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </nav>

            {/* Logo 中央顯示 */}
            <div className="flex justify-center py-5">
              <div className="w-full max-w-[350px] text-center mx-auto">
                <Image
                  src="/logo331x219.png"
                  alt="建林工業"
                  width={350}
                  height={232}
                  className="w-full"
                />
              </div>
            </div>

            {/* 選單連結 */}
            <div className="flex justify-center pt-3 md:pt-5">
              <div className="w-full max-w-[350px] flex justify-between items-start mx-auto">
                <Link
                  href="/about_us"
                  className="writing-mode-vertical-rl tracking-[0.5em] flex justify-center items-center text-[#f8f9fa] hover:text-gray-200 transition-colors"
                  onClick={toggleNavbar}
                >
                  <i className="fas fa-caret-down mb-2"></i>
                  關於建林
                </Link>
                <Link
                  href="/hot_list"
                  className="writing-mode-vertical-rl tracking-[0.5em] flex justify-center items-center text-[#f8f9fa] hover:text-gray-200 transition-colors"
                  onClick={toggleNavbar}
                >
                  <i className="fas fa-caret-down mb-2"></i>
                  熱銷個案
                </Link>
                <Link
                  href="/history_list"
                  className="writing-mode-vertical-rl tracking-[0.5em] flex justify-center items-center text-[#f8f9fa] hover:text-gray-200 transition-colors"
                  onClick={toggleNavbar}
                >
                  <i className="fas fa-caret-down mb-2"></i>
                  歷年個案
                </Link>
                <Link
                  href="/real_estate_list"
                  className="writing-mode-vertical-rl tracking-[0.5em] flex justify-center items-center text-[#f8f9fa] hover:text-gray-200 transition-colors"
                  onClick={toggleNavbar}
                >
                  <i className="fas fa-caret-down mb-2"></i>
                  不動產租售
                </Link>
                <Link
                  href="/contact_us"
                  className="writing-mode-vertical-rl tracking-[0.5em] flex justify-center items-center text-[#f8f9fa] hover:text-gray-200 transition-colors"
                  onClick={toggleNavbar}
                >
                  <i className="fas fa-caret-down mb-2"></i>
                  聯絡我們
                </Link>
                <Link
                  href="/admin"
                  className="writing-mode-vertical-rl tracking-[0.5em] flex justify-center items-center text-[#f8f9fa] hover:text-gray-200 transition-colors"
                  onClick={toggleNavbar}
                >
                  <i className="fas fa-caret-down mb-2"></i>
                  後台管理
                </Link>
              </div>
            </div>
        </div>
      </div>

      {/* 固定頂部導航欄 */}
      <div
        className={`${
          collapsed
            ? 'w-full mx-auto fixed top-0 bg-[#f8f9fa] z-[9998]'
            : 'w-full mx-auto fixed top-0 bg-[#f8f9fa] z-[9998] invisible'
        }`}
      >
        <div className="max-w-[91.666667%] mx-auto px-0">
          <nav className="flex items-center w-full px-0 py-1 md:py-3">
            <Link href="/" className="mr-auto">
              <Image
                src="/logo.svg"
                alt="建林工業"
                width={200}
                height={60}
                className="w-full max-w-[200px]"
              />
            </Link>
            <div
              id="nav-button"
              className={collapsed ? 'border-gray' : 'open border-gray'}
              onClick={toggleNavbar}
            >
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
