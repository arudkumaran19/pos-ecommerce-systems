import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, XCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order, PaginatedResponse } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../lib/formatters';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<PaginatedResponse<Order>>('/api/v1/orders?limit=50');
      setOrders(data.items);
    } catch (err: any) {
      console.error('Failed to load order history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      setCancellingId(orderId);
      setFeedbackMsg(null);
      await apiRequest(`/api/v1/orders/${orderId}/cancel`, { method: 'POST' });
      setFeedbackMsg({
        type: 'success',
        text: 'Order cancelled successfully.',
      });
      await fetchOrders();
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err.message || 'Failed to cancel order.',
      });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Order History
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review your past orders, track delivery status, and manage purchases.
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-xl text-xs mb-6 flex items-center gap-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl animate-pulse h-28" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const canCancel = order.status === 'RESERVED' || order.status === 'PAID';
            return (
              <div
                key={order.id}
                className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-slate-700"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-semibold text-white">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getOrderStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(order.created_at)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {order.items.map((i) => `${i.product_name} (×${i.quantity})`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end border-t md:border-0 border-slate-800 pt-3 md:pt-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">
                      Order Total
                    </span>
                    <span className="text-base font-extrabold text-white">
                      {formatCurrency(order.total)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/orders/${order.id}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-1"
                    >
                      Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {order.status === 'RESERVED' && (
                      <Link
                        to={`/payment/${order.id}`}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-sm"
                      >
                        Complete Payment
                      </Link>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancelOrder(order.id)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {order.status === 'PAID' ? 'Refund' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800 max-w-lg mx-auto">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-base font-bold text-white">No historical orders</h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            You have not placed any orders yet.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
