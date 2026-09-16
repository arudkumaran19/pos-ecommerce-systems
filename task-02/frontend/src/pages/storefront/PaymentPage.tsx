import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, AlertCircle, RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Order } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatOrderStatus, formatProductName } from '../../lib/formatters';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useToast } from '../../context/ToastContext';
import { CheckoutProgress, CHECKOUT_STEPS } from '../../components/checkout/CheckoutProgress';

const inputClass =
  'w-full px-3.5 py-2.5 rounded-lg bg-[#080A0F] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] focus:ring-1 focus:ring-[#4FB7A5] transition-colors';
const labelClass = 'text-xs font-medium text-[#A5ABB5] block mb-1.5';

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Card input states
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [cardholderName, setCardholderName] = useState('Alex Morgan');

  useEffect(() => {
    setIdempotencyKey(`idemp_${crypto.randomUUID()}`);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Order>(`/api/v1/orders/${orderId}`);
      setOrder(data);
    } catch {
      setErrorMessage('We couldn\'t load this order. Please check your order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading || !order) {
    return <LoadingScreen message="Loading order details…" submessage="Please wait a moment" />;
  }

  const activeReservation = order.reservations.find((r) => r.status === 'ACTIVE');
  const isReserved = order.status === 'RESERVED';

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(' ') : raw);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  const handleCardCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setResultMessage(null);

      const res = await apiRequest('/api/v1/payments', {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        body: {
          order_id: order.id,
          payment_mode: 'MOCK_SUCCESS',
          payment_method: 'CARD',
          card_last4: cardNumber.replace(/\s/g, '').slice(-4) || '4242',
        },
      });

      if (res.status === 'SUCCEEDED') {
        toast.success('Payment successful.');
        navigate(`/orders/confirmation/${order.id}`);
      } else if (res.status === 'FAILED') {
        const msg = 'Payment couldn\'t be completed. Please check your details and try again.';
        setErrorMessage(msg);
        toast.error(msg);
        await fetchOrder();
      } else if (res.status === 'TIMEOUT') {
        const msg = 'We couldn\'t confirm your payment yet. Your items are still held — please try again.';
        setResultMessage(msg);
        toast.warning('Payment timed out. Please try again.');
        setIdempotencyKey(`idemp_${crypto.randomUUID()}`);
        await fetchOrder();
      }
    } catch {
      const msg = 'Something went wrong. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
      await fetchOrder();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Progress indicator */}
      <div className="mb-10">
        <CheckoutProgress steps={CHECKOUT_STEPS} currentStep={3} />
      </div>

      {/* Back to Delivery */}
      <div className="mb-8 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="p-2 rounded-lg text-[#6F7682] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
          aria-label="Back to delivery details"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Delivery</span>
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
          Payment
        </h1>
        <p className="text-xs text-[#A5ABB5] mt-1">
          Your payment details are securely processed.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left: Payment Form */}
        <div className="md:col-span-7 space-y-5">
          {/* Items-held timer */}
          {isReserved && activeReservation && (
            <CountdownTimer
              expiresAt={activeReservation.expires_at}
              onExpire={() => fetchOrder()}
            />
          )}

          {isReserved ? (
            <form onSubmit={handlePaymentSubmit} className="bg-[#10131A] border border-[#242A35] p-6 rounded-xl space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className={labelClass}>Payment</label>
                <div className="p-3 rounded-lg border border-[#4FB7A5]/40 bg-[#151922] flex items-center justify-between text-xs text-[#F5F3EE]">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-[#4FB7A5]" />
                    <span className="font-medium">Credit or Debit Card</span>
                  </div>
                </div>
              </div>

              {/* Card Details */}
              <div className="space-y-3.5 pt-1">
                <div>
                  <label htmlFor="cardholder-name" className={labelClass}>Cardholder name</label>
                  <input
                    id="cardholder-name"
                    type="text"
                    required
                    autoComplete="cc-name"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Alex Morgan"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="card-number" className={labelClass}>Card number</label>
                  <div className="relative">
                    <input
                      id="card-number"
                      type="text"
                      required
                      autoComplete="cc-number"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="•••• •••• •••• ••••"
                      className={`${inputClass} pr-10`}
                    />
                    <CreditCard className="w-4 h-4 text-[#6F7682] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card-expiry" className={labelClass}>Expiry date</label>
                    <input
                      id="card-expiry"
                      type="text"
                      required
                      autoComplete="cc-exp"
                      value={cardExpiry}
                      onChange={handleCardExpiryChange}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="card-cvc" className={labelClass}>Security code</label>
                    <input
                      id="card-cvc"
                      type="password"
                      required
                      autoComplete="cc-csc"
                      value={cardCvc}
                      onChange={handleCardCvcChange}
                      placeholder="•••"
                      maxLength={4}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div role="alert" className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-medium text-rose-200">{errorMessage}</p>
                    <p className="text-[11px] text-rose-300/80">Your card has not been charged.</p>
                  </div>
                </div>
              )}

              {/* Timeout Alert */}
              {resultMessage && (
                <div role="alert" className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span>{resultMessage}</span>
                </div>
              )}

              {/* Primary Pay CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-6 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#080A0F] border-t-transparent rounded-full animate-spin" />
                    <span>Processing payment…</span>
                  </>
                ) : (
                  <span>Pay {formatCurrency(order.total)}</span>
                )}
              </button>

              {/* Security note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A5ABB5] pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#4FB7A5]" />
                <span>Secure checkout</span>
              </div>
            </form>
          ) : (
            /* Order is no longer in a payable state */
            <div className="bg-[#10131A] border border-[#242A35] p-6 rounded-xl text-center space-y-4">
              <h3 className="text-sm font-semibold text-[#F5F3EE]">Payment is not available</h3>
              <p className="text-xs text-[#A5ABB5]">
                This order is currently{' '}
                <span className="font-semibold text-[#F5F3EE]">
                  {formatOrderStatus(order.status)}
                </span>
                {order.status === 'EXPIRED' && ' — your items are no longer being held.'}
                {order.status === 'PAID' && ' — thank you for your purchase.'}
              </p>
              <div>
                {order.status === 'EXPIRED' ? (
                  <Link
                    to="/cart"
                    className="inline-block px-4 py-2 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold transition-colors"
                  >
                    Return to cart
                  </Link>
                ) : (
                  <Link
                    to="/orders"
                    className="inline-block px-4 py-2 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] hover:bg-[#1C222C] text-xs font-medium transition-colors"
                  >
                    View your orders
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-[#10131A] border border-[#242A35] p-6 rounded-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <h3 className="text-sm font-semibold text-[#F5F3EE]">Order summary</h3>
              <span className="text-xs text-[#A5ABB5]">
                {formatOrderStatus(order.status)}
              </span>
            </div>

            <div className="divide-y divide-[#242A35] text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between">
                  <div className="pr-3">
                    <p className="font-medium text-[#F5F3EE] line-clamp-1">{formatProductName(item.product_name)}</p>
                    <p className="text-[#6F7682] text-[11px] mt-0.5">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <span className="font-medium text-[#F5F3EE] shrink-0 tabular-nums">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#242A35] pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-[#A5ABB5]">
                <span>Subtotal</span>
                <span className="text-[#F5F3EE] tabular-nums">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#A5ABB5]">
                <span>Delivery</span>
                <span className="text-[#4FB7A5]">Free</span>
              </div>
              <div className="border-t border-[#242A35] pt-2.5 flex justify-between text-sm font-bold text-[#F5F3EE]">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
