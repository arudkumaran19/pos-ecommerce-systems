import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../lib/formatters';

export const CartPage: React.FC = () => {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (loading && !cart) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const items = cart?.items || [];
  const hasItems = items.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Your Shopping Cart
        </h1>
        {hasItems && (
          <button
            type="button"
            onClick={() => clearCart()}
            className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
          >
            Clear Entire Cart
          </button>
        )}
      </div>

      {hasItems ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="glass-panel p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-slate-800"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                    alt={item.product.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-slate-900 shrink-0"
                  />
                  <div>
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="font-bold text-white text-sm sm:text-base hover:text-emerald-400 transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {formatCurrency(item.unit_price)} each
                    </span>
                    <span className="text-[11px] text-emerald-400 block mt-1">
                      {item.product.available_stock} in stock
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-slate-800">
                  {/* Quantity Spinner */}
                  <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="px-2 text-xs font-bold text-white min-w-[1.75rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= item.product.available_stock}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-extrabold text-white block">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 sticky top-24 space-y-6">
              <h2 className="text-base font-bold text-white">Order Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-semibold text-white">{formatCurrency(cart?.subtotal || '0')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Estimated Shipping</span>
                  <span className="font-semibold text-emerald-400">FREE</span>
                </div>
                <div className="border-t border-slate-800 pt-3 flex justify-between text-base font-extrabold text-white">
                  <span>Total Due</span>
                  <span>{formatCurrency(cart?.subtotal || '0')}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Your items are held for 5 minutes during checkout.
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800 max-w-lg mx-auto">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white">Your cart is empty</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Explore our curated catalog and discover high-performance electronics and accessories.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md"
          >
            Start Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
};
