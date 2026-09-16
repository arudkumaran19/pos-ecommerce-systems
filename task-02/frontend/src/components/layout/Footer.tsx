import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Lock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#242A35] bg-[#080A0F] mt-24 text-[#A5ABB5] text-xs" aria-label="Footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#151922] border border-[#242A35] flex items-center justify-center text-[#4FB7A5]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-wider text-[#F5F3EE]">TECHLOOM</span>
            </div>
            <p className="text-[#6F7682] leading-relaxed text-xs">
              Curated everyday equipment and precision hardware designed for quiet performance and long-term durability.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-[#F5F3EE] text-xs uppercase tracking-wider mb-3">Shop & Explore</h4>
            <ul className="space-y-2 text-[#6F7682]">
              <li>
                <Link to="/" className="hover:text-[#F5F3EE] transition-colors">Catalogue</Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-[#F5F3EE] transition-colors">Order History</Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-[#F5F3EE] transition-colors">Shopping Cart</Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="font-semibold text-[#F5F3EE] text-xs uppercase tracking-wider mb-3">Account</h4>
            <ul className="space-y-2 text-[#6F7682]">
              <li>
                <Link to="/profile" className="hover:text-[#F5F3EE] transition-colors">My Details</Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-[#F5F3EE] transition-colors">Security & Password</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-[#F5F3EE] transition-colors">Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Reassurance */}
          <div>
            <h4 className="font-semibold text-[#F5F3EE] text-xs uppercase tracking-wider mb-3">Secure Commerce</h4>
            <p className="text-[#6F7682] leading-relaxed text-xs mb-3">
              Your payment details are securely processed and protected. Inventory is temporarily held during checkout to ensure availability.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#A5ABB5]">
              <Lock className="w-3.5 h-3.5 text-[#4FB7A5]" />
              <span>Secure checkout</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#1C222C] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#6F7682] text-[11px]">
          <p>© 2026 TechLoom. All rights reserved.</p>
          <p>Modern essentials for everyday work and living.</p>
        </div>
      </div>
    </footer>
  );
};
