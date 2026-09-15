import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Clock, ShieldCheck, XCircle, CreditCard, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatDate, getOrderStatusColor } from '../../lib/formatters';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useToast } from '../../context/ToastContext';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Order>(`/api/v1/orders/${id}`);
      setOrder(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm('Confirm order cancellation / refund?')) return;

    try {
      setCancelling(true);
      setErrorMsg(null);
      await apiRequest(`/api/v1/orders/${order.id}/cancel`, { method: 'POST' });
      toast.success('Order cancelled successfully.');
      await fetchOrder();
    } catch (err: any) {
      const msg = err.message || 'Cancellation failed.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !order) {
    return <LoadingScreen message="Loading Order Details..." submessage="Fetching order status and payment information" />;
  }

  const canCancel = order.status === 'RESERVED' || order.status === 'PAID';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Orders
      </Link>

      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        {/* Header info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="text-xs font-mono text-emerald-400">Order ID: {order.id}</span>
            <h1 className="text-2xl font-extrabold text-white mt-1">
              Order Details
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getOrderStatusColor(
                order.status
              )}`}
            >
              {order.status}
            </span>

            {canCancel && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                {order.status === 'PAID' ? 'Request Refund' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Snapshot Table */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            Purchased Items
          </h2>
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800 text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-bold text-white text-sm block">{item.product_name}</span>
                  <span className="text-slate-400">
                    Unit Price: {formatCurrency(item.unit_price)} × {item.quantity}
                  </span>
                </div>
                <span className="text-sm font-extrabold text-white">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-semibold">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="text-emerald-400 font-semibold">FREE</span>
            </div>
            <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-white">
              <span>Total</span>
              <span className="text-emerald-400">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
          <h3 className="font-bold text-white mb-2">Shipping Destination</h3>
          <p>{order.shipping_address?.full_name || 'Customer'}</p>
          <p>{order.shipping_address?.address_line1 || 'Address'}</p>
          <p>{order.shipping_address?.city}, {order.shipping_address?.postal_code}</p>
          <p>{order.shipping_address?.country}</p>
        </div>
      </div>
    </div>
  );
};
