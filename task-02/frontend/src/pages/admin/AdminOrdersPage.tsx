import React, { useEffect, useState } from 'react';
import { 
  RotateCcw, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  X,
  ChevronLeft, 
  ChevronRight,
  Clock
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Order, PaginatedResponse } from '../../types';
import { formatCurrency, formatDate, formatOrderStatus, formatProductName, getOrderStatusColor } from '../../lib/formatters';
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight">Orders</h1>
          <p className="text-[#A5ABB5] text-xs mt-0.5">
            Manage customer purchases, view order details, and issue refunds.
          </p>
        </div>
        <div className="text-xs text-[#A5ABB5] bg-[#10131A] px-3 py-1.5 rounded-lg border border-[#242A35]">
          Total orders: <span className="font-semibold text-[#F5F3EE]">{total}</span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#10131A] p-3.5 rounded-xl border border-[#242A35] flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-[#A5ABB5] mr-1.5">Filter status:</span>
          {['', 'PAID', 'RESERVED', 'PENDING', 'CANCELLED', 'EXPIRED', 'FAILED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-[#4FB7A5] text-[#080A0F] font-semibold'
                  : 'bg-[#151922] border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#1C222C]'
              }`}
            >
              {st ? formatOrderStatus(st) : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-[#10131A] rounded-xl border border-[#242A35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242A35] text-[11px] font-semibold text-[#A5ABB5] uppercase tracking-wider bg-[#151922]/50">
                <th className="py-3 px-4">Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242A35] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#A5ABB5]">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#4FB7A5] border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#A5ABB5]">
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#151922]/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#F5F3EE]">
                      #{o.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      {o.customer ? (
                        <div>
                          <div className="font-medium text-[#F5F3EE] text-xs">{o.customer.full_name}</div>
                          <div className="text-[11px] text-[#A5ABB5]">{o.customer.email}</div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#A5ABB5]">Customer #{o.user_id.slice(0, 8)}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#A5ABB5]">
                      {o.items?.length || 0} {o.items?.length === 1 ? 'item' : 'items'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-[#F5F3EE] tabular-nums">
                      {formatCurrency(o.total)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${getOrderStatusColor(o.status)}`}>
                        {formatOrderStatus(o.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#A5ABB5]">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded-lg border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors"
                          title="View order details"
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
                            className="p-1.5 rounded-lg border border-amber-500/20 text-amber-400 hover:bg-amber-500/10 transition-colors"
                            title="Issue refund"
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
          <div className="p-3.5 border-t border-[#242A35] flex items-center justify-between text-xs text-[#A5ABB5]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Inspection Modal */}
      {selectedOrder && !refundModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10131A] border border-[#242A35] max-w-2xl w-full p-6 rounded-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <div>
                <h3 className="font-bold text-[#F5F3EE] text-base">
                  Order #{selectedOrder.id.slice(0, 8)}
                </h3>
                <span className="text-xs text-[#A5ABB5]">
                  Placed {formatDate(selectedOrder.created_at)}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35]">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded-md text-[10px] font-medium border ${getOrderStatusColor(selectedOrder.status)}`}>
                  {formatOrderStatus(selectedOrder.status)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35]">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block">Subtotal</span>
                <span className="text-xs font-semibold text-[#F5F3EE] mt-1 block tabular-nums">{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35]">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block">Delivery</span>
                <span className="text-xs font-semibold text-[#F5F3EE] mt-1 block">{selectedOrder.shipping_fee === '0' ? 'Free' : formatCurrency(selectedOrder.shipping_fee)}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35]">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block">Total</span>
                <span className="text-xs font-bold text-[#4FB7A5] mt-1 block tabular-nums">{formatCurrency(selectedOrder.total)}</span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="text-xs font-semibold text-[#A5ABB5] uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="divide-y divide-[#242A35] border border-[#242A35] rounded-lg overflow-hidden bg-[#080A0F]">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-[#F5F3EE] block">{formatProductName(item.product_name)}</span>
                      <span className="text-[11px] text-[#A5ABB5]">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                    </div>
                    <span className="font-semibold text-[#F5F3EE] tabular-nums">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stock Holds */}
            {selectedOrder.reservations && selectedOrder.reservations.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-[#A5ABB5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Held items
                </h4>
                <div className="space-y-1.5">
                  {selectedOrder.reservations.map((res) => (
                    <div key={res.id} className="p-2.5 rounded-lg bg-[#151922] border border-[#242A35] flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#A5ABB5]">Qty: {res.quantity}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#A5ABB5]">Expires: {formatDate(res.expires_at)}</span>
                        <span className="text-[11px] font-medium text-[#F5F3EE]">
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
              <div className="p-3 rounded-lg bg-[#151922] border border-[#242A35] text-xs">
                <span className="text-[10px] text-[#A5ABB5] uppercase tracking-wider block mb-1">Delivery address</span>
                <p className="text-[#F5F3EE]">
                  {[
                    selectedOrder.shipping_address.full_name,
                    selectedOrder.shipping_address.address_line1,
                    selectedOrder.shipping_address.city,
                    selectedOrder.shipping_address.postal_code,
                    selectedOrder.shipping_address.country,
                  ].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-[#242A35]">
              {selectedOrder.status === 'PAID' && (
                <button
                  onClick={() => {
                    setRefundReason('');
                    setActionError(null);
                    setRefundModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-medium"
                >
                  Issue refund
                </button>
              )}
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE] hover:bg-[#1C222C]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {refundModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10131A] border border-[#242A35] max-w-md w-full p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <h3 className="font-bold text-[#F5F3EE] text-base">
                Confirm refund
              </h3>
              <button onClick={() => setRefundModalOpen(false)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <p className="text-xs text-[#A5ABB5] leading-relaxed">
              This will refund the amount of <strong className="text-[#F5F3EE]">{formatCurrency(selectedOrder.total)}</strong> back to the customer and update the order status.
            </p>

            <div>
              <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Reason for refund</label>
              <input
                type="text"
                required
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="e.g. Customer requested return"
                className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRefundModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE]"
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={actionLoading || !refundReason}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-semibold disabled:opacity-50"
              >
                {actionLoading ? 'Processing refund…' : 'Confirm refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
