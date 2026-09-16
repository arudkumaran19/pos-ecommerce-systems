import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  ScrollText,
  ArrowUpRight,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { LoadingScreen } from '../common/LoadingScreen';

const STORAGE_KEY = 'techloom_admin_sidebar_collapsed';

const navItems = [
  { label: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Customers', path: '/admin/users', icon: Users },
  { label: 'Activity Log', path: '/admin/audit-logs', icon: ScrollText },
];

export const AdminLayout: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Desktop sidebar collapse state (persisted)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Escape key closes mobile drawer
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && drawerOpen) setDrawerOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  // Trap focus inside drawer when open
  useEffect(() => {
    if (drawerOpen && drawerRef.current) {
      const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }
  }, [drawerOpen]);

  if (loading) {
    return <LoadingScreen message="Loading admin operations…" submessage="Verifying credentials" />;
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const isActive = (path: string, exact = false) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/admin') return 'Overview';
    if (location.pathname.startsWith('/admin/orders')) return 'Orders';
    if (location.pathname.startsWith('/admin/products')) return 'Products';
    if (location.pathname.startsWith('/admin/users')) return 'Customers';
    if (location.pathname.startsWith('/admin/audit-logs')) return 'Activity Log';
    return 'Store Operations';
  };

  // Nav link component
  const NavItem: React.FC<{ item: typeof navItems[0]; inDrawer?: boolean }> = ({
    item,
    inDrawer = false,
  }) => {
    const active = isActive(item.path, item.exact);
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        aria-current={active ? 'page' : undefined}
        title={collapsed && !inDrawer ? item.label : undefined}
        className={`flex items-center gap-3 rounded-lg text-xs font-medium transition-colors ${
          collapsed && !inDrawer ? 'justify-center px-0 py-2.5 w-full' : 'px-3 py-2.5 w-full'
        } ${
          active
            ? 'bg-[#151922] text-[#F5F3EE] font-semibold border border-[#242A35]'
            : 'text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] border border-transparent'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#4FB7A5]' : 'text-[#6F7682]'}`} />
        {(!collapsed || inDrawer) && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-[#080A0F] text-[#F5F3EE]">
      {/* ─────────────── DESKTOP PERSISTENT SIDEBAR ─────────────── */}
      <aside
        className={`hidden md:flex flex-col shrink-0 h-full border-r border-[#242A35] bg-[#10131A] transition-[width] duration-150 ease-in-out select-none z-30 ${
          collapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
        aria-label="Admin Navigation"
      >
        {/* Top Header: Brand + Collapse Toggle */}
        <div
          className={`h-16 shrink-0 border-b border-[#242A35] flex items-center px-4 ${
            collapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#151922] border border-[#242A35] flex items-center justify-center text-[#4FB7A5] shrink-0">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold tracking-wide text-[#F5F3EE] block leading-none">
                  TECHLOOM
                </span>
                <span className="text-[10px] text-[#6F7682] font-medium tracking-wide block mt-1">
                  Store Operations
                </span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            className="p-1.5 rounded-lg text-[#6F7682] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors cursor-pointer"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-150 ${collapsed ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Sections">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* Bottom Section: Storefront Link & Account */}
        <div className="shrink-0 border-t border-[#242A35] p-3 space-y-2 bg-[#0C0F15]">
          {collapsed ? (
            <Link
              to="/"
              title="View Storefront"
              className="flex items-center justify-center p-2.5 w-full rounded-lg text-[#6F7682] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors"
              aria-label="View Storefront"
            >
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/"
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg bg-[#151922] hover:bg-[#1A202C] text-[#A5ABB5] hover:text-[#F5F3EE] text-xs font-medium border border-[#242A35] transition-colors"
            >
              <span>View Store</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#6F7682]" />
            </Link>
          )}

          {/* User profile row */}
          {!collapsed && (
            <div className="pt-2 border-t border-[#1C222C] flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar url={user.avatar_url} name={user.full_name} size="sm" />
                <div className="truncate">
                  <span className="text-xs font-semibold text-[#F5F3EE] block truncate">{user.full_name}</span>
                  <span className="text-[10px] text-[#6F7682] block truncate">{user.email}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
                className="p-1 text-[#6F7682] hover:text-[#FB7185] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─────────────── MOBILE DRAWER OVERLAY ─────────────── */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Admin Navigation"
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#10131A] border-r border-[#242A35] flex flex-col transform transition-transform duration-200 ease-in-out shadow-2xl ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 border-b border-[#242A35] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#151922] border border-[#242A35] flex items-center justify-center text-[#4FB7A5]">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#F5F3EE] block leading-none">TECHLOOM</span>
              <span className="text-[10px] text-[#6F7682] block mt-1">Store Operations</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close navigation"
            className="p-1.5 rounded-lg text-[#6F7682] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Admin Sections">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} inDrawer />
          ))}
        </nav>

        <div className="border-t border-[#242A35] p-4 space-y-3 bg-[#0C0F15]">
          <Link
            to="/"
            className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg bg-[#151922] text-[#A5ABB5] hover:text-[#F5F3EE] text-xs font-medium border border-[#242A35] transition-colors"
          >
            <span>View Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar url={user.avatar_url} name={user.full_name} size="sm" />
              <div className="truncate">
                <span className="text-xs font-semibold text-[#F5F3EE] block truncate">{user.full_name}</span>
                <span className="text-[10px] text-[#6F7682] block truncate">{user.email}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="p-1 text-[#6F7682] hover:text-[#FB7185] transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────── MAIN APPLICATION VIEWPORT ─────────────── */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#080A0F]">
        {/* Persistent Shell Topbar */}
        <header className="h-16 shrink-0 border-b border-[#242A35] bg-[#10131A] px-4 sm:px-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              className="md:hidden p-2 rounded-lg text-[#6F7682] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / Title */}
            <div>
              <h1 className="text-sm font-semibold text-[#F5F3EE] tracking-tight leading-none">
                {getPageTitle()}
              </h1>
            </div>
          </div>

          {/* Right Header Status / Account */}
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#151922] text-[#A5ABB5] border border-[#242A35]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4FB7A5]" />
              Store Operations
            </span>
            <div className="flex items-center gap-2">
              <Avatar url={user.avatar_url} name={user.full_name} size="sm" />
              <span className="hidden md:inline text-xs text-[#A5ABB5] font-medium">
                {user.full_name}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
