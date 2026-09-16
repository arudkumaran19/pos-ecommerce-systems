import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShoppingBag, ShieldCheck } from 'lucide-react';

/**
 * A dedicated, distraction-free checkout shell used across Cart → Delivery → Payment.
 * Provides unified visual continuity, clean restrained surfaces, and quiet reassurance.
 */
export const CheckoutLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F3EE] flex flex-col selection:bg-[#4FB7A5]/20 selection:text-[#F5F3EE]">
      {/* Checkout header */}
      <header className="border-b border-[#242A35] bg-[#10131A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 text-[#F5F3EE] hover:opacity-85 transition-opacity focus:outline-none focus:ring-1 focus:ring-[#4FB7A5] rounded-lg"
            aria-label="Return to TechLoom store"
          >
            <div className="w-8 h-8 rounded-lg bg-[#151922] border border-[#242A35] flex items-center justify-center text-[#4FB7A5]">
              <ShoppingBag className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-sm font-bold tracking-wider">TECHLOOM</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs text-[#A5ABB5] font-medium">
            <ShieldCheck className="w-4 h-4 text-[#4FB7A5]" />
            <span>Secure checkout</span>
          </div>
        </div>
      </header>

      {/* Main checkout content */}
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
