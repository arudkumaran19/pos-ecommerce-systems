import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

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

  // Total 5 minutes (300 seconds) progress
  const progressPercent = Math.min(100, (secondsRemaining / 300) * 100);

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isExpired
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          : isCritical
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 animate-pulse'
          : 'bg-slate-900/80 border-slate-700/60 text-slate-200'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {isExpired ? (
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          ) : (
            <Clock className={`w-5 h-5 ${isCritical ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />
          )}
          <span className="text-sm font-medium">
            {isExpired ? 'Reservation Expired' : 'Items Reserved For:'}
          </span>
        </div>
        <div className="font-mono text-lg font-bold tracking-wider">
          {formattedTime}
        </div>
      </div>

      {/* Visual countdown progress bar */}
      {!isExpired && (
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              isCritical ? 'bg-amber-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {isExpired && (
        <p className="text-xs text-rose-400 mt-2">
          Your reservation window has ended. Items have been released back to stock.
        </p>
      )}
    </div>
  );
};
