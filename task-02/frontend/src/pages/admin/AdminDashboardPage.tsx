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
      setError(err.message || 'Failed to load store metrics');
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
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#4FB7A5] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight">
            Store overview
          </h1>
          <p className="text-[#A5ABB5] text-xs mt-0.5">
            Operational summary of orders, revenue, and customer activity.
          </p>
        </div>

        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151922] border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#1C222C] text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          {error}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-[#10131A] p-5 rounded-xl border border-[#242A35]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABB5]">Settled revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#151922] text-[#4FB7A5] flex items-center justify-center border border-[#242A35]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F5F3EE] tabular-nums">
              {stats ? formatCurrency(stats.total_revenue) : '$0.00'}
            </div>
            <p className="text-[11px] text-[#6F7682] mt-1">Confirmed payments</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-[#10131A] p-5 rounded-xl border border-[#242A35]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABB5]">Total orders</span>
            <div className="w-8 h-8 rounded-lg bg-[#151922] text-[#F5F3EE] flex items-center justify-center border border-[#242A35]">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#F5F3EE] tabular-nums">
              {stats?.total_orders ?? 0}
            </div>
            <p className="text-[11px] text-[#6F7682] mt-1">
              {stats?.pending_orders ?? 0} awaiting payment
            </p>
          </div>
        </div>

        {/* Active Holds */}
        <div className="bg-[#10131A] p-5 rounded-xl border border-[#242A35]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABB5]">Active holds</span>
            <div className="w-8 h-8 rounded-lg bg-[#151922] text-amber-400 flex items-center justify-center border border-[#242A35]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-300 tabular-nums">
              {stats?.active_reservations ?? 0}
            </div>
            <p className="text-[11px] text-[#6F7682] mt-1">Items currently held in checkout</p>
          </div>
        </div>

        {/* Failed Payments */}
        <div className="bg-[#10131A] p-5 rounded-xl border border-[#242A35]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A5ABB5]">Unsuccessful</span>
            <div className="w-8 h-8 rounded-lg bg-[#151922] text-rose-400 flex items-center justify-center border border-[#242A35]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-rose-400 tabular-nums">
              {stats?.failed_payments ?? 0}
            </div>
            <p className="text-[11px] text-[#6F7682] mt-1">Failed or expired checkouts</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#10131A] p-5 rounded-xl border border-[#242A35] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#151922] text-[#4FB7A5] flex items-center justify-center border border-[#242A35]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#A5ABB5] block">Customers</span>
              <span className="text-xl font-bold text-[#F5F3EE] tabular-nums">{stats?.total_customers ?? 0}</span>
            </div>
          </div>
          <Link
            to="/admin/users"
            className="p-2 rounded-lg bg-[#151922] border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#1C222C] transition-colors"
            title="View customers"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-[#10131A] p-5 rounded-xl border border-[#242A35] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-[#151922] text-[#F5F3EE] flex items-center justify-center border border-[#242A35]">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-medium text-[#A5ABB5] block">Products</span>
              <span className="text-xl font-bold text-[#F5F3EE] tabular-nums">{stats?.total_products ?? 0}</span>
            </div>
          </div>
          <Link
            to="/admin/products"
            className="p-2 rounded-lg bg-[#151922] border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#1C222C] transition-colors"
            title="View products"
          >
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="bg-[#10131A] p-5 sm:p-6 rounded-xl border border-[#242A35] space-y-4">
        <h2 className="text-sm font-semibold text-[#F5F3EE]">Quick navigation</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/admin/orders"
            className="p-4 rounded-lg bg-[#151922] border border-[#242A35] hover:border-[#323B4A] transition-colors group"
          >
            <ShoppingCart className="w-4 h-4 text-[#4FB7A5] mb-2" />
            <h3 className="text-xs font-semibold text-[#F5F3EE]">Orders</h3>
            <p className="text-[11px] text-[#A5ABB5] mt-0.5">Manage customer orders, view payment receipts, and issue refunds.</p>
          </Link>

          <Link
            to="/admin/products"
            className="p-4 rounded-lg bg-[#151922] border border-[#242A35] hover:border-[#323B4A] transition-colors group"
          >
            <Package className="w-4 h-4 text-[#4FB7A5] mb-2" />
            <h3 className="text-xs font-semibold text-[#F5F3EE]">Products</h3>
            <p className="text-[11px] text-[#A5ABB5] mt-0.5">Manage catalog inventory, update pricing, and add products.</p>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-4 rounded-lg bg-[#151922] border border-[#242A35] hover:border-[#323B4A] transition-colors group"
          >
            <ScrollText className="w-4 h-4 text-[#4FB7A5] mb-2" />
            <h3 className="text-xs font-semibold text-[#F5F3EE]">Audit logs</h3>
            <p className="text-[11px] text-[#A5ABB5] mt-0.5">Review operational history and administrative actions.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};
