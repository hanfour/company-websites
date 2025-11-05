'use client';

interface LoadingMaskProps {
  isVisible: boolean;
  text?: string;
}

export default function LoadingMask({ isVisible, text = '載入中...' }: LoadingMaskProps) {
  if (!isVisible) return null;

  return (
    <div className="loading-mask">
      <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      <h5 className="mt-4 text-white text-lg">{text}</h5>
    </div>
  );
}
