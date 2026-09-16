import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Order, PaginatedResponse } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatDate, formatOrderStatus, getOrderStatusColor } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';

export const MyOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const toast = useToast();

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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
          My Orders
        </h1>
        <p className="text-xs text-[#A5ABB5] mt-1">
          Review your past purchases and check delivery status.
        </p>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs mb-6 flex items-center gap-2.5 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5]'
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
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-[#10131A] border border-[#242A35] p-5 rounded-xl animate-pulse h-24" />
          ))}
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-3">
          {orders.map((order) => {
            const shortId = order.id.slice(0, 8);
            const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);

            return (
              <div
                key={order.id}
                className="bg-[#10131A] border border-[#242A35] p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-[#323B4A]"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-[#F5F3EE]">
                      Order #{shortId}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${getOrderStatusColor(
                        order.status
                      )}`}
                    >
                      {formatOrderStatus(order.status)}
                    </span>
                  </div>
                  <div className="text-xs text-[#A5ABB5] mt-1.5 flex items-center gap-3">
                    <span>{formatDate(order.created_at)}</span>
                    <span>•</span>
                    <span>{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 pt-3 sm:pt-0 border-t sm:border-0 border-[#242A35]">
                  <span className="text-sm font-bold text-[#F5F3EE] tabular-nums">
                    {formatCurrency(order.total)}
                  </span>
                  <Link
                    to={`/orders/${order.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-[#151922] border border-[#242A35] hover:border-[#4FB7A5]/50 text-xs font-medium text-[#F5F3EE] transition-colors"
                  >
                    View order
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#10131A] rounded-xl border border-[#242A35]">
          <p className="text-sm font-semibold text-[#F5F3EE]">No orders yet</p>
          <p className="text-xs text-[#A5ABB5] mt-1 mb-5">
            When you complete a purchase, your orders will appear here.
          </p>
          <Link
            to="/"
            className="inline-block px-4 py-2 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold transition-colors"
          >
            Start shopping
          </Link>
        </div>
      )}
    </div>
  );
};
