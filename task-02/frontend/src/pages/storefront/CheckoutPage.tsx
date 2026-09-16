import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, MapPin, ArrowLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatProductName } from '../../lib/formatters';
import { Order } from '../../types';
import { CheckoutProgress, CHECKOUT_STEPS } from '../../components/checkout/CheckoutProgress';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] focus:ring-1 focus:ring-[#4FB7A5] transition-colors';
const labelClass = 'text-xs font-medium text-[#A5ABB5] block mb-1.5';

export const CheckoutPage: React.FC = () => {
  const { cart, refreshCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    address_line1: '42 Oxford Street',
    city: 'London',
    postal_code: 'W1D 1BS',
    country: 'United Kingdom',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user?.full_name) {
      setShippingAddress((prev) => ({ ...prev, full_name: user.full_name }));
    }
  }, [user]);

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-base font-bold text-[#F5F3EE] mb-2">Your cart is empty</h2>
        <p className="text-xs text-[#A5ABB5] mb-6">Add items to your cart before proceeding to delivery.</p>
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold transition-colors inline-block"
        >
          Continue shopping
        </Link>
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
      toast.success('Your items are held. Please complete payment.');
      navigate(`/payment/${order.id}`);
    } catch (err: any) {
      const msg = err.message || 'Something went wrong. Please check your details and try again.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Progress indicator */}
      <div className="mb-10">
        <CheckoutProgress steps={CHECKOUT_STEPS} currentStep={2} />
      </div>

      <div className="mb-8 flex items-center gap-3">
        <Link
          to="/cart"
          className="p-2 rounded-lg text-[#6F7682] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors"
          aria-label="Back to cart"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
            Delivery
          </h1>
          <p className="text-xs text-[#A5ABB5] mt-0.5">
            Where should we send your order?
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Shipping Form */}
        <form onSubmit={handleCheckoutSubmit} className="md:col-span-2 space-y-5">
          <div className="bg-[#10131A] border border-[#242A35] p-6 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-[#F5F3EE] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#4FB7A5]" />
              Shipping address
            </h2>

            <div>
              <label htmlFor="full-name" className={labelClass}>Full name</label>
              <input
                id="full-name"
                type="text"
                required
                autoComplete="name"
                value={shippingAddress.full_name}
                onChange={(e) => setShippingAddress({ ...shippingAddress, full_name: e.target.value })}
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label htmlFor="address-line1" className={labelClass}>Address</label>
              <input
                id="address-line1"
                type="text"
                required
                autoComplete="street-address"
                value={shippingAddress.address_line1}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address_line1: e.target.value })}
                className={inputClass}
                placeholder="42 Oxford Street"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className={labelClass}>City</label>
                <input
                  id="city"
                  type="text"
                  required
                  autoComplete="address-level2"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  className={inputClass}
                  placeholder="London"
                />
              </div>
              <div>
                <label htmlFor="postal-code" className={labelClass}>Postal code</label>
                <input
                  id="postal-code"
                  type="text"
                  required
                  autoComplete="postal-code"
                  value={shippingAddress.postal_code}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, postal_code: e.target.value })}
                  className={inputClass}
                  placeholder="W1D 1BS"
                />
              </div>
            </div>

            <div>
              <label htmlFor="country" className={labelClass}>Country / Region</label>
              <input
                id="country"
                type="text"
                required
                autoComplete="country-name"
                value={shippingAddress.country}
                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                className={inputClass}
                placeholder="United Kingdom"
              />
            </div>
          </div>

          {errorMsg && (
            <div role="alert" className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-[#080A0F] border-t-transparent rounded-full animate-spin" />
                <span>Processing…</span>
              </div>
            ) : (
              <>
                <span>Continue to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-[#10131A] border border-[#242A35] p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-semibold text-[#F5F3EE]">Order summary</h3>
            <div className="divide-y divide-[#242A35] text-xs max-h-64 overflow-y-auto">
              {items.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between gap-2">
                  <div>
                    <span className="text-[#F5F3EE] font-medium block truncate max-w-[140px]">
                      {formatProductName(item.product.name)}
                    </span>
                    <span className="text-[#6F7682]">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-semibold text-[#F5F3EE] shrink-0 tabular-nums">
                    {formatCurrency(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#242A35] pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#A5ABB5]">
                <span>Subtotal</span>
                <span className="font-medium text-[#F5F3EE] tabular-nums">{formatCurrency(cart?.subtotal || '0')}</span>
              </div>
              <div className="flex justify-between text-[#A5ABB5]">
                <span>Delivery</span>
                <span className="font-medium text-[#4FB7A5]">Free</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#F5F3EE] pt-2 border-t border-[#242A35]">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(cart?.subtotal || '0')}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#151922] rounded-lg border border-[#242A35] text-[11px] text-[#A5ABB5] flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#4FB7A5] shrink-0 mt-0.5" />
            <span>
              Your items are being held while you complete checkout.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
