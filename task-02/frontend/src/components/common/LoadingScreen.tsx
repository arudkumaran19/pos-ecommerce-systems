import React from 'react';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading TechLoom...',
  submessage = 'Connecting to secure catalog & services',
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center relative overflow-hidden ${
        fullScreen ? 'min-h-screen w-full bg-slate-950' : 'py-20 w-full'
      }`}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none animate-ping" />

      {/* Brand Icon Spinner */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-[2px] shadow-xl shadow-emerald-500/20 animate-spin">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            {/* Center counter-rotating icon */}
            <Sparkles className="w-7 h-7 text-emerald-400 animate-pulse" />
          </div>
        </div>
        <div className="absolute -inset-1 rounded-2xl bg-emerald-500/30 blur-md -z-10 animate-pulse" />
      </div>

      {/* Text Animation */}
      <div className="text-center z-10 px-4">
        <h4 className="text-base font-bold text-white tracking-wide flex items-center justify-center gap-2">
          <span>{message}</span>
        </h4>
        {submessage && (
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto animate-pulse">
            {submessage}
          </p>
        )}
      </div>

      {/* Modern mini progress bar */}
      <div className="w-40 h-1 bg-slate-900 rounded-full overflow-hidden mt-6 border border-slate-800">
        <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full w-2/3 animate-pulse" />
      </div>
    </div>
  );
};
