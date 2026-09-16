import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CountdownTimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ expiresAt, onExpire, className = '' }) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
    return Math.max(0, diff);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setSecondsRemaining(0);
        clearInterval(timer);
        if (onExpire) onExpire();
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCritical = secondsRemaining <= 60 && secondsRemaining > 0;
  const isExpired = secondsRemaining === 0;

  if (isExpired) {
    return (
      <div className={`p-4 rounded-xl bg-[#10131A] border border-rose-500/30 text-left ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#F5F3EE]">Your checkout has expired</p>
            <p className="text-xs text-[#A5ABB5]">
              Your items are no longer being held. Return to your cart to start again.
            </p>
            <div className="pt-2">
              <Link
                to="/cart"
                className="inline-block px-3.5 py-1.5 rounded-lg bg-[#151922] border border-[#242A35] hover:border-[#4FB7A5]/50 text-xs font-medium text-[#F5F3EE] transition-colors"
              >
                Return to cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-3.5 rounded-xl border transition-colors ${
        isCritical
          ? 'bg-[#151922] border-amber-500/40 text-amber-300'
          : 'bg-[#10131A] border-[#242A35] text-[#A5ABB5]'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Clock className={`w-3.5 h-3.5 ${isCritical ? 'text-amber-400' : 'text-[#4FB7A5]'}`} />
          <span>
            {isCritical ? (
              <span className="font-medium text-amber-300">Less than a minute remaining</span>
            ) : (
              <span>Items held for you</span>
            )}
          </span>
        </div>
        <div className="text-xs font-semibold text-[#F5F3EE] tabular-nums">
          {formattedTime}
        </div>
      </div>
    </div>
  );
};
