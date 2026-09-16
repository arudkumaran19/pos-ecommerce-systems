import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Shield, User, LogOut, Package, Key, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Avatar } from '../common/Avatar';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#10131A] border-b border-[#242A35]" aria-label="Main Navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Main Nav */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 group focus:outline-none focus:ring-1 focus:ring-[#4FB7A5] rounded-lg"
            >
              <div className="w-7 h-7 rounded-lg bg-[#151922] border border-[#242A35] flex items-center justify-center text-[#4FB7A5]">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold tracking-wider text-[#F5F3EE]">
                TECHLOOM
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium" aria-label="Store Sections">
              <Link to="/" className="text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors">
                Shop
              </Link>
              {user && (
                <Link to="/orders" className="text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors">
                  Orders
                </Link>
              )}
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#151922] border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] transition-colors text-xs font-medium"
                >
                  <Shield className="w-3.5 h-3.5 text-[#4FB7A5]" />
                  Store Operations
                </Link>
              )}
            </nav>
          </div>

          {/* Right Controls: Cart & Profile */}
          <div className="flex items-center gap-3">
            {/* Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] border border-transparent transition-colors"
              title="Shopping Cart"
              aria-label={`Shopping cart with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-[#080A0F] bg-[#4FB7A5] rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Profile / Auth */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className="flex items-center gap-2 p-0.5 rounded-full hover:ring-1 hover:ring-[#4FB7A5] transition-all cursor-pointer"
                >
                  <Avatar url={user.avatar_url} name={user.full_name} size="sm" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#10131A] shadow-dropdown border border-[#242A35] py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#1C222C]">
                      <p className="text-xs font-semibold text-[#F5F3EE] truncate">{user.full_name}</p>
                      <p className="text-[11px] text-[#6F7682] truncate">{user.email}</p>
                      {user.role === 'ADMIN' && (
                        <span className="inline-block mt-1 text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#151922] text-[#4FB7A5] border border-[#242A35]">
                          Admin
                        </span>
                      )}
                    </div>

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-[#F5F3EE] hover:bg-[#151922] transition-colors"
                      >
                        <Shield className="w-4 h-4 text-[#4FB7A5]" />
                        Store Operations
                      </Link>
                    )}

                    <Link
                      to="/orders"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A5ABB5] hover:bg-[#151922] hover:text-[#F5F3EE] transition-colors"
                    >
                      <Package className="w-4 h-4 text-[#6F7682]" />
                      Orders
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A5ABB5] hover:bg-[#151922] hover:text-[#F5F3EE] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#6F7682]" />
                      My Account
                    </Link>

                    <Link
                      to="/security"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-[#A5ABB5] hover:bg-[#151922] hover:text-[#F5F3EE] transition-colors"
                    >
                      <Key className="w-4 h-4 text-[#6F7682]" />
                      Security
                    </Link>

                    <div className="border-t border-[#1C222C] my-1"></div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="text-xs font-medium px-3 py-1.5 rounded-lg text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-medium px-3.5 py-1.5 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold transition-colors"
                >
                  Create account
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-[#242A35] space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-xs font-medium text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] rounded-lg"
            >
              Shop
            </Link>
            {user && (
              <Link
                to="/orders"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] rounded-lg"
              >
                Orders
              </Link>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-xs font-medium text-[#4FB7A5] bg-[#151922] border border-[#242A35] rounded-lg"
              >
                Store Operations
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
