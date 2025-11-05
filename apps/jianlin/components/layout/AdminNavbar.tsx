'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { logout } from '@/app/actions';

export default function AdminNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = async () => {
    await logout();
  };

  const navItems = [
    { href: '/admin/account', label: '修改密碼' },
    { href: '/admin/contacts', label: '聯絡表單' },
    { href: '/admin/home', label: '官網首頁' },
    { href: '/admin/about', label: '關於建林' },
    { href: '/admin/hot_list', label: '熱銷個案' },
    { href: '/admin/history_list', label: '歷年個案' },
    { href: '/admin/real_estate_list', label: '不動產租售' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/logo.svg"
                alt="建林工業"
                width={150}
                height={45}
              />
            </div>
          </div>

          <div className="hidden lg:ml-6 lg:flex lg:items-center lg:space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'text-[var(--main-color)] font-bold'
                    : 'text-gray-600 hover:text-[var(--main-color)]'
                }`}
              >
                {item.label}
              </Link>
            ))}

            <div className="flex items-center ml-4 border-l border-gray-200 pl-4">
              <span className="text-gray-700 text-sm mr-4">管理員, 您好！</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-[var(--main-color)] transition-colors"
              >
                登出
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[var(--main-color)] focus:outline-none"
            >
              <span className="sr-only">開啟選單</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === item.href
                    ? 'text-[var(--main-color)] bg-gray-50 font-bold'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[var(--main-color)]'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 pt-4 pb-3">
              <div className="px-3 py-2">
                <p className="text-sm text-gray-700 mb-2">管理員, 您好！</p>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-600 hover:text-[var(--main-color)]"
                >
                  登出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
