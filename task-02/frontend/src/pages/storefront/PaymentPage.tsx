import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Lock, AlertCircle, RefreshCw, CheckCircle2, Shield } from 'lucide-react';
import { Order, MockPaymentMode } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, getOrderStatusColor } from '../../lib/formatters';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import { MockPaymentSelector } from '../../components/checkout/MockPaymentSelector';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { useToast } from '../../context/ToastContext';

export const PaymentPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [paymentMode, setPaymentMode] = useState<MockPaymentMode>('MOCK_SUCCESS');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Generate unique idempotency key once per page session
  useEffect(() => {
    setIdempotencyKey(`idemp_${crypto.randomUUID()}`);
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Order>(`/api/v1/orders/${orderId}`);
      setOrder(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load order.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) fetchOrder();
  }, [orderId]);

  if (loading || !order) {
    return <LoadingScreen message="Loading Order & Payment..." submessage="Initializing payment gateway & verifying item reservation" />;
  }

  // Active reservation expiry date
  const activeReservation = order.reservations.find((r) => r.status === 'ACTIVE');
  const isReserved = order.status === 'RESERVED';

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
          payment_mode: paymentMode,
          payment_method: 'CARD',
          card_last4: '4242',
        },
      });

      if (res.status === 'SUCCEEDED') {
        toast.success('Payment confirmed successfully!');
        navigate(`/orders/confirmation/${order.id}`);
      } else if (res.status === 'FAILED') {
        const msg = res.error_message || 'Payment was declined. Please check your payment details or try another card.';
        setErrorMessage(msg);
        toast.error(msg);
        await fetchOrder();
      } else if (res.status === 'TIMEOUT') {
        const msg = 'Payment timed out. Your items remain held so you can retry your payment.';
        setResultMessage(msg);
        toast.warning(msg);
        setIdempotencyKey(`idemp_${crypto.randomUUID()}`);
        await fetchOrder();
      }
    } catch (err: any) {
      const msg = err.message || 'Payment processing failed. Please try again.';
      setErrorMessage(msg);
      toast.error(msg);
      await fetchOrder();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Order Payment
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getOrderStatusColor(
              order.status
            )}`}
          >
            {order.status}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Order Reference: <span className="font-mono text-slate-300">{order.id}</span>
        </p>
      </div>

      {/* Reservation Countdown Timer Banner */}
      {isReserved && activeReservation && (
        <div className="mb-6">
          <CountdownTimer
            expiresAt={activeReservation.expires_at}
            onExpire={() => fetchOrder()}
          />
        </div>
      )}

      <div className="space-y-6">
        {/* Order Items Snapshot Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-white">Order Summary</h3>
          <div className="divide-y divide-slate-800 text-xs">
            {order.items.map((item) => (
              <div key={item.id} className="py-2 flex justify-between">
                <span className="text-slate-200">{item.product_name} (×{item.quantity})</span>
                <span className="font-bold text-white">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-extrabold text-white">
            <span>Total Payable</span>
            <span className="text-emerald-400">{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Payment Submission Form */}
        {isReserved ? (
          <form onSubmit={handlePaymentSubmit} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
            <MockPaymentSelector
              selectedMode={paymentMode}
              onChange={setPaymentMode}
              disabled={isProcessing}
            />

            {/* Simulated Card Details */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium text-slate-300">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Test Card Details
                </span>
                <span className="font-mono">Test Mode</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between font-mono text-sm text-slate-200">
                <span>•••• •••• •••• 4242</span>
                <span className="text-xs text-slate-500">12/28</span>
              </div>
            </div>

            {/* Alerts */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {resultMessage && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />
                <span>{resultMessage}</span>
              </div>
            )}

            {/* Submit Button with Anti-Duplicate Protection */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing Payment Securely...</span>
                </div>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay {formatCurrency(order.total)} Now
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Duplicate payment protection enabled</span>
            </div>
          </form>
        ) : (
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center space-y-4">
            <h3 className="text-base font-bold text-white">This order cannot be paid</h3>
            <p className="text-xs text-slate-400">
              Order status is currently <strong>{order.status}</strong>.
            </p>
            <button
              type="button"
              onClick={() => navigate('/orders')}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
            >
              View Order History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
