import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading…',
  submessage,
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullScreen ? 'min-h-screen w-full bg-[#080A0F]' : 'py-20 w-full'
      }`}
    >
      {/* Brand spinner */}
      <div className="relative mb-5">
        <div className="w-12 h-12 rounded-xl bg-[#10131A] border border-[#242A35] flex items-center justify-center">
          <ShoppingBag className="w-5 h-5 text-[#4FB7A5]" />
        </div>
        {/* Subtle spinning ring */}
        <div className="absolute inset-0 rounded-xl border-2 border-transparent border-t-[#4FB7A5] animate-spin" />
      </div>

      {/* Text */}
      <div className="text-center px-4">
        <h4 className="text-xs font-semibold text-[#F5F3EE]">{message}</h4>
        {submessage && (
          <p className="text-[11px] text-[#A5ABB5] mt-1 max-w-xs mx-auto">{submessage}</p>
        )}
      </div>
    </div>
  );
};
