import React from 'react';
import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, ScrollText, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../common/Avatar';
import { LoadingScreen } from '../common/LoadingScreen';

export const AdminLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Loading Admin Console..." submessage="Verifying administrator privileges" />;
  }

  // Guard: Only ADMIN role allowed
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { label: 'Overview', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Customers', path: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Products', path: '/admin/products', icon: <Package className="w-4 h-4" /> },
    { label: 'All Orders', path: '/admin/orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Audit Trail', path: '/admin/audit-logs', icon: <ScrollText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-800/80 p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight block">
                ADMIN CONSOLE
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase block -mt-0.5">
                TechLoom Control
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Area with Avatar & Back to Store */}
        <div className="pt-6 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <Avatar url={user.avatar_url} name={user.full_name} size="sm" />
            <div className="truncate">
              <span className="text-xs font-bold text-white block truncate">{user.full_name}</span>
              <span className="text-[10px] text-slate-500 block truncate">{user.email}</span>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Storefront
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
