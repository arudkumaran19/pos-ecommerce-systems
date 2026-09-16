import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Order } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatDate, formatOrderStatus, formatProductName, getOrderStatusColor } from '../../lib/formatters';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useToast } from '../../context/ToastContext';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Order>(`/api/v1/orders/${id}`);
      setOrder(data);
    } catch {
      toast.error('Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setCancelling(true);
      await apiRequest(`/api/v1/orders/${order.id}/cancel`, { method: 'POST' });
      toast.success('Order cancelled.');
      await fetchOrder();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !order) {
    return <LoadingScreen message="Loading order details…" submessage="Please wait a moment" />;
  }

  const isReserved = order.status === 'RESERVED';
  const shortOrderId = order.id.slice(0, 8);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#A5ABB5] hover:text-[#F5F3EE] mb-6 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to orders</span>
      </Link>

      <div className="bg-[#10131A] p-6 sm:p-8 rounded-2xl border border-[#242A35] space-y-6">
        {/* Header info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#242A35] pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight">
              Order #{shortOrderId}
            </h1>
            <p className="text-xs text-[#A5ABB5] mt-1">
              Placed on {formatDate(order.created_at)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getOrderStatusColor(
                order.status
              )}`}
            >
              {formatOrderStatus(order.status)}
            </span>

            {isReserved && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium cursor-pointer disabled:opacity-50 transition-colors"
              >
                {cancelling ? 'Cancelling…' : 'Cancel order'}
              </button>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h2 className="text-xs font-semibold text-[#A5ABB5] uppercase tracking-wider mb-3">
            Items
          </h2>
          <div className="divide-y divide-[#242A35] border border-[#242A35] rounded-xl bg-[#080A0F] overflow-hidden text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#F5F3EE]">{formatProductName(item.product_name)}</p>
                  <p className="text-[#6F7682] mt-0.5">
                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                  </p>
                </div>
                <span className="font-semibold text-[#F5F3EE] tabular-nums">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order Totals & Delivery Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="bg-[#151922] p-4 rounded-xl border border-[#242A35] text-xs space-y-1.5">
            <h3 className="font-semibold text-[#F5F3EE] mb-2">Delivery address</h3>
            <p className="text-[#A5ABB5]">{order.shipping_address?.full_name || 'Customer'}</p>
            <p className="text-[#A5ABB5]">{order.shipping_address?.address_line1}</p>
            <p className="text-[#A5ABB5]">
              {order.shipping_address?.city}, {order.shipping_address?.postal_code}
            </p>
            <p className="text-[#A5ABB5]">{order.shipping_address?.country}</p>
          </div>

          <div className="bg-[#151922] p-4 rounded-xl border border-[#242A35] text-xs space-y-2">
            <h3 className="font-semibold text-[#F5F3EE] mb-2">Payment summary</h3>
            <div className="flex justify-between text-[#A5ABB5]">
              <span>Subtotal</span>
              <span className="text-[#F5F3EE] tabular-nums">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#A5ABB5]">
              <span>Delivery</span>
              <span className="text-[#4FB7A5]">Free</span>
            </div>
            <div className="border-t border-[#242A35] pt-2 flex justify-between font-bold text-sm text-[#F5F3EE]">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Secondary Technical Reference (Expandable) */}
        <div className="pt-2 border-t border-[#242A35]">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs text-[#6F7682] hover:text-[#A5ABB5] transition-colors"
          >
            <span>Technical reference</span>
            {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-3.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-[11px] font-mono text-[#6F7682] space-y-1">
              <p>Order ID: {order.id}</p>
              <p>User ID: {order.user_id}</p>
              <p>Status: {order.status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
