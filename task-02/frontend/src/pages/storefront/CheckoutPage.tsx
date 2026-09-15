import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency } from '../../lib/formatters';
import { Order } from '../../types';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    full_name: user?.full_name || '',
    address_line1: '42 Oxford Street',
    city: 'London',
    postal_code: 'W1D 1BS',
    country: 'United Kingdom',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.full_name && !shippingAddress.full_name) {
      setShippingAddress((prev) => ({ ...prev, full_name: user.full_name }));
    }
  }, [user]);

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-white mb-2">No items to checkout</h2>
        <p className="text-xs text-slate-400 mb-6">Please add items to your cart before proceeding.</p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      setErrorMsg(null);

      const order = await apiRequest<Order>('/api/v1/checkout', {
        method: 'POST',
        body: {
          shipping_address: shippingAddress,
        },
      });

      await refreshCart();
      toast.success('Order created! Please complete payment within 5 minutes.');
      navigate(`/payment/${order.id}`);
    } catch (err: any) {
      const msg = err.message || 'Could not complete checkout. Please try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Checkout
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review shipping details. Your items will be held for <strong>5 minutes</strong> during payment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <form onSubmit={handleCheckoutSubmit} className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Delivery Destination
            </h2>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Recipient Full Name
              </label>
              <input
                type="text"
                required
                value={shippingAddress.full_name}
                onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={shippingAddress.address_line1}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Postcode</label>
                <input
                  type="text"
                  required
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Country</label>
              <input
                type="text"
                required
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Holding your items...</span>
              </div>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Confirm & Proceed to Payment
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Mini Order Summary */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3">Items in Order</h3>
            <div className="divide-y divide-slate-800 text-xs max-h-60 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between gap-2">
                  <div>
                    <span className="text-white font-medium block truncate max-w-[140px]">
                      {item.product.name}
                    </span>
                    <span className="text-slate-400">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-white">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between text-sm font-extrabold text-white">
              <span>Total</span>
              <span>{formatCurrency(cart?.subtotal || '0')}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your items are held exclusively for you and will not be sold to other shoppers while checkout is in progress.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
