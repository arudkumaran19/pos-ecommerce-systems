import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import { Order } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { LoadingScreen } from '../../components/common/LoadingScreen';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading || !order) {
    return <LoadingScreen message="Loading Order Confirmation..." submessage="Verifying payment receipt and order summary" />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Payment Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Thank You for Your Order!
          </h1>
          <p className="text-xs text-slate-400 mt-2">
            Order Reference: <span className="font-mono text-white">{order.id}</span>
          </p>
          <p className="text-xs text-slate-500">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        {/* Receipt Snapshot */}
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 text-left space-y-3">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Order Summary
          </h3>
          <div className="divide-y divide-slate-800 text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between">
                <div>
                  <span className="text-white font-medium">{item.product_name}</span>
                  <span className="text-slate-400 block">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</span>
                </div>
                <span className="font-bold text-white">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between text-sm font-extrabold text-white">
            <span>Total Paid</span>
            <span className="text-emerald-400">{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/orders"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
          >
            <Package className="w-4 h-4" />
            View My Orders
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
};
