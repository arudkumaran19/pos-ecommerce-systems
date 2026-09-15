import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  RotateCcw, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Order, OrderStatus, PaginatedResponse } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const toast = useToast();

  // Selected Order for Inspection / Refund
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (statusFilter) params.append('status', statusFilter);

      const data = await apiClient.get<PaginatedResponse<Order>>(`/api/v1/admin/orders?${params.toString()}`);
      setOrders(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleRefund = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    setActionError(null);

    try {
      const updated = await apiClient.post<Order>(`/api/v1/admin/orders/${selectedOrder.id}/refund`, {
        reason: refundReason || 'Admin issued refund'
      });
      const msg = `Order #${selectedOrder.id.slice(0, 8)} successfully refunded`;
      setSuccessMsg(msg);
      toast.success(msg);
      setRefundModalOpen(false);
      setSelectedOrder(updated);
      fetchOrders();
    } catch (err: any) {
      const msg = err.message || 'Failed to refund order';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RESERVED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'PENDING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CANCELLED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'EXPIRED':
        return 'bg-slate-800 text-slate-400 border-slate-700';
      case 'FAILED':
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Orders & Fulfillment</h1>
          <p className="text-slate-400 text-sm mt-1">
            Track customer orders, monitor status, and issue refunds
          </p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          Total Orders: <span className="font-bold text-white">{total}</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-2.5 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1">Filter by Status:</span>
          {['', 'PAID', 'RESERVED', 'PENDING', 'CANCELLED', 'EXPIRED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {st || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="py-3.5 px-4">
                      {o.customer ? (
                        <div>
                          <div className="font-semibold text-slate-200 text-xs">{o.customer.full_name}</div>
                          <div className="font-mono text-[11px] text-slate-500">{o.customer.email}</div>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-400">{o.user_id.slice(0, 8)}...</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {o.items?.length || 0} items
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(o.status)}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                          title="Inspect Order"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {o.status === 'PAID' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setRefundReason('');
                              setActionError(null);
                              setRefundModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-purple-500/20 text-purple-400 hover:bg-purple-500/10 transition-colors"
                            title="Administrative Refund"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Inspection Modal */}
      {selectedOrder && !refundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-2xl w-full p-6 border-slate-700 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">
                  Order Details #{selectedOrder.id}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Placed {formatDate(selectedOrder.created_at)}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Subtotal</span>
                <span className="text-xs font-bold text-white mt-1 block">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Shipping</span>
                <span className="text-xs font-bold text-white mt-1 block">{formatCurrency(selectedOrder.shipping_fee)}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{item.product_name}</span>
                      <span className="text-[11px] text-slate-400">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                    </div>
                    <span className="font-bold text-white">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Reservations */}
            {selectedOrder.reservations && selectedOrder.reservations.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Inventory Reservations
                </h4>
                <div className="space-y-1.5">
                  {selectedOrder.reservations.map((res) => (
                    <div key={res.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-300">Product: {res.product_id.slice(0, 8)}...</span>
                        <span className="text-[11px] text-slate-500 ml-2">Qty: {res.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-slate-400">Expires: {formatDate(res.expires_at)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          res.status === 'ACTIVE' ? 'bg-amber-500/10 text-amber-400' :
                          res.status === 'CONSUMED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {selectedOrder.shipping_address && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Shipping Destination</span>
                <p className="text-slate-300">
                  {[
                    selectedOrder.shipping_address.full_name,
                    selectedOrder.shipping_address.address_line1,
                    selectedOrder.shipping_address.address_line2,
                    selectedOrder.shipping_address.city,
                    selectedOrder.shipping_address.postal_code,
                    selectedOrder.shipping_address.country,
                    selectedOrder.shipping_address.street,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              {selectedOrder.status === 'PAID' && (
                <button
                  onClick={() => {
                    setRefundReason('');
                    setActionError(null);
                    setRefundModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                >
                  Issue Refund
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 border-slate-700 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                Confirm Administrative Refund
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <p className="text-xs text-slate-300">
              This will refund the amount of <strong className="text-emerald-400">{formatCurrency(selectedOrder.total)}</strong> back to the customer, transition order to <strong className="text-purple-400">CANCELLED</strong>, release inventory if applicable, and log an immutable audit record.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Refund Reason</label>
              <input
                type="text"
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer requested return / Damaged goods"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={actionLoading || !refundReason}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Processing Refund...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
