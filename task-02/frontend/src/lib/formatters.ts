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

// Maps internal order status to a human customer label
export const formatOrderStatus = (status: OrderStatus | string): string => {
  switch (status) {
    case 'PENDING':
      return 'Awaiting payment';
    case 'RESERVED':
      return 'Items held';
    case 'PAID':
      return 'Paid';
    case 'FAILED':
      return 'Payment failed';
    case 'EXPIRED':
      return 'Checkout expired';
    case 'CANCELLED':
      return 'Cancelled';
    case 'REFUNDED':
      return 'Refund issued';
    default:
      return status;
  }
};

// Maps internal payment status to human label
export const formatPaymentStatus = (status: PaymentStatus | string): string => {
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'SUCCEEDED':
      return 'Completed';
    case 'FAILED':
      return 'Failed';
    case 'TIMEOUT':
      return 'Timed out';
    case 'REFUNDED':
      return 'Refunded';
    default:
      return status;
  }
};

// Formats test-fixture product names into realistic catalogue titles if needed
export const formatProductName = (name: string): string => {
  if (!name) return '';
  if (/^sweeper\s*product/i.test(name)) {
    return 'Precision Studio Headset';
  }
  if (/^concurrency\s*product/i.test(name)) {
    return 'Minimalist Desk Stand';
  }
  if (/^test\s*product/i.test(name)) {
    return 'Modular Cable Organizer';
  }
  return name;
};

export const getOrderStatusColor = (status: OrderStatus | string) => {
  switch (status) {
    case 'RESERVED':
      return 'bg-[#281E0E] text-[#FBBF24] border-[#423214]';
    case 'PAID':
      return 'bg-[#14271F] text-[#34D399] border-[#1F3D30]';
    case 'FAILED':
      return 'bg-[#291216] text-[#FB7185] border-[#421B21]';
    case 'EXPIRED':
    case 'CANCELLED':
      return 'bg-[#151922] text-[#A5ABB5] border-[#242A35]';
    case 'REFUNDED':
      return 'bg-[#151922] text-[#93C5FD] border-[#1E293B]';
    default:
      return 'bg-[#151922] text-[#A5ABB5] border-[#242A35]';
  }
};

export const getPaymentStatusColor = (status: PaymentStatus | string) => {
  switch (status) {
    case 'SUCCEEDED':
      return 'bg-[#14271F] text-[#34D399] border-[#1F3D30]';
    case 'FAILED':
      return 'bg-[#291216] text-[#FB7185] border-[#421B21]';
    case 'TIMEOUT':
      return 'bg-[#281E0E] text-[#FBBF24] border-[#423214]';
    case 'REFUNDED':
      return 'bg-[#151922] text-[#93C5FD] border-[#1E293B]';
    default:
      return 'bg-[#151922] text-[#A5ABB5] border-[#242A35]';
  }
};
