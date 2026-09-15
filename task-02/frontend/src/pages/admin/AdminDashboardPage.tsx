import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ShieldCheck, 
  RefreshCw,
  ScrollText
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { AdminStats } from '../../types';
import { formatCurrency } from '../../lib/formatters';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const data = await apiClient.get<AdminStats>('/api/v1/admin/stats');
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(), 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Operations Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time storefront metrics, active reservations, and business activity
          </p>
        </div>

        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Updating...' : 'Refresh Metrics'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Revenue */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settled Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white">
              {stats ? formatCurrency(stats.total_revenue) : '$0.00'}
            </div>
            <p className="text-xs text-slate-500 mt-1">All PAID orders to date</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-white">
              {stats?.total_orders ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.pending_orders ?? 0} awaiting payment
            </p>
          </div>
        </div>

        {/* Active Reservations */}
        <div className="glass-card p-5 relative overflow-hidden group border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Active Holds
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-amber-400">
              {stats?.active_reservations ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Active checkout reservations</p>
          </div>
        </div>

        {/* Failed / Timeout Payments */}
        <div className="glass-card p-5 relative overflow-hidden group border-rose-500/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Payment Failures</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-black text-rose-400">
              {stats?.failed_payments ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Failed or Timed out attempts</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Registered Customers</span>
              <span className="text-2xl font-black text-white">{stats?.total_customers ?? 0}</span>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="glass-card p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Catalog Products</span>
              <span className="text-2xl font-black text-white">{stats?.total_products ?? 0}</span>
            </div>
          </div>
          <Link
            to="/admin/products"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Control Panels & Quick Actions */}
      <div className="glass-card p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h2 className="text-lg font-bold text-white">Management Shortcuts</h2>
          <span className="text-xs text-slate-500">Fast access to administrative controls</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/users"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
          >
            <Users className="w-5 h-5 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">Customer Directory</h3>
            <p className="text-xs text-slate-400 mt-1">Manage accounts, status flags, and administrative password resets.</p>
          </Link>

          <Link
            to="/admin/products"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
          >
            <Package className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Inventory Control</h3>
            <p className="text-xs text-slate-400 mt-1">Adjust stock levels, create new catalog items, and edit product pricing.</p>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
          >
            <ScrollText className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
            <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors">Immutable Audit Logs</h3>
            <p className="text-xs text-slate-400 mt-1">Inspect forensic audit records with actor IDs, IPs, and before/after payloads.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
