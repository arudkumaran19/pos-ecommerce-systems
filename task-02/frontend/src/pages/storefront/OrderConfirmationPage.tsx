import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { Order } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatDate, formatProductName } from '../../lib/formatters';
import { LoadingScreen } from '../../components/common/LoadingScreen';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Order>(`/api/v1/orders/${id}`);
        setOrder(data);
      } catch (err) {
        console.error('Failed to load order', err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleCopyRef = () => {
    if (order?.id) {
      navigator.clipboard.writeText(order.id).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  if (loading || !order) {
    return <LoadingScreen message="Loading order confirmation…" submessage="Please wait a moment" />;
  }

  const shortOrderId = order.id.slice(0, 8);

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="bg-[#10131A] border border-[#242A35] p-8 sm:p-10 rounded-2xl text-center space-y-6">
        {/* Success Icon */}
        <div className="w-12 h-12 rounded-full bg-[#151922] border border-[#4FB7A5]/40 text-[#4FB7A5] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#F5F3EE] tracking-tight">
            Order confirmed
          </h1>
          <p className="text-xs text-[#A5ABB5] mt-1.5">
            Thank you for your purchase.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-[#151922] border border-[#242A35] rounded-lg text-xs">
            <span className="text-[#A5ABB5]">Order #{shortOrderId}</span>
            <button
              type="button"
              onClick={handleCopyRef}
              title="Copy full reference"
              className="text-[#6F7682] hover:text-[#4FB7A5] transition-colors cursor-pointer"
              aria-label="Copy order reference"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-[#4FB7A5]" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-[#6F7682] mt-1.5">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        {/* Receipt Snapshot */}
        <div className="bg-[#080A0F] rounded-xl p-5 border border-[#242A35] text-left space-y-3">
          <h3 className="text-xs font-semibold text-[#A5ABB5]">
            Order summary
          </h3>
          <div className="divide-y divide-[#242A35] text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between">
                <div>
                  <span className="text-[#F5F3EE] font-medium">{formatProductName(item.product_name)}</span>
                  <span className="text-[#6F7682] block mt-0.5">
                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                  </span>
                </div>
                <span className="font-semibold text-[#F5F3EE] tabular-nums">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#242A35] pt-3 flex justify-between text-xs font-bold text-[#F5F3EE]">
            <span>Total paid</span>
            <span className="tabular-nums">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <Link
            to={`/orders/${order.id}`}
            className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors"
          >
            View order
          </Link>
          <Link
            to="/"
            className="w-full sm:flex-1 py-2.5 px-4 rounded-lg bg-[#151922] border border-[#242A35] hover:border-[#323B4A] text-[#F5F3EE] text-xs font-medium transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
};
