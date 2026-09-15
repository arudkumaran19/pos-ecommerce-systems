import React from 'react';
import { ShoppingBag, ShieldCheck, Lock, RefreshCw } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 mt-20 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">TECHLOOM</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              High-reliability modern gear engineered for everyday life. Guaranteed availability and secure, seamless checkout.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3">Guarantees</h4>
            <ul className="space-y-2 text-slate-500">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Guaranteed Item Availability
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                Secure, Accurate Billing
              </li>
              <li className="flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                Fair Cart Holds
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3">Storefront</h4>
            <ul className="space-y-2 text-slate-500">
              <li>Audio & Electronics</li>
              <li>Minimalist Accessories</li>
              <li>Apparel & Footwear</li>
              <li>Home & Living</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-slate-200 mb-3">Security</h4>
            <p className="text-slate-500 leading-relaxed mb-2">
              Protected by enterprise-grade encryption and secure session handling.
            </p>
            <span className="inline-block px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
              256-bit SSL | Verified Secure
            </span>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© 2026 TechLoom Inc. All rights reserved.</p>
          <p className="text-[11px] text-slate-500">Designed for speed, reliability, and security.</p>
        </div>
      </div>
    </footer>
  );
};
