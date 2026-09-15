import { OrderStatus, PaymentStatus } from '../types';

export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const getOrderStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'RESERVED':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    case 'PAID':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'FAILED':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'EXPIRED':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'CANCELLED':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    default:
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus) => {
  switch (status) {
    case 'SUCCEEDED':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'FAILED':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    case 'TIMEOUT':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    case 'REFUNDED':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    default:
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  }
};
