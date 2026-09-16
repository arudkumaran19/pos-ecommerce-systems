import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatProductName } from '../../lib/formatters';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { CheckoutProgress, CHECKOUT_STEPS } from '../../components/checkout/CheckoutProgress';

export const CartPage: React.FC = () => {
  const { cart, loading, updateQuantity, removeItem, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  if (loading && !cart) {
    return <LoadingScreen message="Loading your bag…" submessage="Updating available items and totals" />;
  }

  const handleClear = async () => {
    await clearCart();
    toast.info('Your cart has been cleared.');
  };

  const handleRemove = async (itemId: string, name?: string) => {
    await removeItem(itemId);
    toast.info(name ? `Removed ${formatProductName(name)} from cart.` : 'Item removed from cart.');
  };

  const items = cart?.items || [];
  const hasItems = items.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Checkout Progress */}
      <div className="mb-10">
        <CheckoutProgress steps={CHECKOUT_STEPS} currentStep={1} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
            Shopping Cart
          </h1>
          {hasItems && (
            <p className="text-xs text-[#A5ABB5] mt-1">
              {items.length} item{items.length !== 1 ? 's' : ''} in your cart
            </p>
          )}
        </div>
        {hasItems && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-[#6F7682] hover:text-rose-400 font-medium cursor-pointer transition-colors"
          >
            Clear cart
          </button>
        )}
      </div>

      {hasItems ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-[#10131A] border border-[#242A35] p-5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors hover:border-[#323B4A]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={item.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
                    alt={formatProductName(item.product.name)}
                    className="w-16 h-16 rounded-lg object-cover bg-[#080A0F] shrink-0 border border-[#242A35]"
                  />
                  <div>
                    <Link
                      to={`/products/${item.product.slug}`}
                      className="font-medium text-[#F5F3EE] text-sm hover:text-[#4FB7A5] transition-colors line-clamp-1"
                    >
                      {formatProductName(item.product.name)}
                    </Link>
                    <span className="text-xs text-[#A5ABB5] block mt-0.5">
                      {formatCurrency(item.unit_price)} each
                    </span>
                    <span className="text-[11px] text-[#4FB7A5] block mt-0.5">
                      In stock
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-0 border-[#242A35]">
                  {/* Quantity Spinner */}
                  <div className="flex items-center border border-[#242A35] bg-[#080A0F] rounded-lg overflow-hidden">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="px-2.5 py-1 text-xs text-[#A5ABB5] hover:text-[#F5F3EE] disabled:opacity-40 transition-colors cursor-pointer"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="px-2 text-xs font-medium text-[#F5F3EE] min-w-[1.5rem] text-center tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={item.quantity >= item.product.available_stock}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="px-2.5 py-1 text-xs text-[#A5ABB5] hover:text-[#F5F3EE] disabled:opacity-40 transition-colors cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-semibold text-[#F5F3EE] block tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id, item.product.name)}
                    className="p-1.5 text-[#6F7682] hover:text-rose-400 transition-colors cursor-pointer"
                    title="Remove item"
                    aria-label={`Remove ${formatProductName(item.product.name)}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="md:col-span-1">
            <div className="bg-[#10131A] border border-[#242A35] p-6 rounded-xl sticky top-24 space-y-5">
              <h2 className="text-sm font-bold text-[#F5F3EE]">Order summary</h2>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-[#A5ABB5]">
                  <span>Subtotal</span>
                  <span className="font-medium text-[#F5F3EE] tabular-nums">{formatCurrency(cart?.subtotal || '0')}</span>
                </div>
                <div className="flex justify-between text-[#A5ABB5]">
                  <span>Delivery</span>
                  <span className="font-medium text-[#4FB7A5]">Free</span>
                </div>
                <div className="border-t border-[#242A35] pt-3 flex justify-between text-sm font-bold text-[#F5F3EE]">
                  <span>Total</span>
                  <span className="tabular-nums">{formatCurrency(cart?.subtotal || '0')}</span>
                </div>
              </div>

              <div className="p-3 bg-[#151922] rounded-lg border border-[#242A35] text-[11px] text-[#A5ABB5] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4FB7A5] shrink-0 mt-0.5" />
                <span>Your items are held for you while you complete checkout.</span>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Continue to Delivery</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-[#10131A] rounded-xl border border-[#242A35] max-w-md mx-auto">
          <ShoppingBag className="w-10 h-10 text-[#6F7682] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[#F5F3EE]">Your cart is empty</h2>
          <p className="text-xs text-[#A5ABB5] mt-1 mb-6">
            Explore our collection to find products.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold transition-colors"
          >
            <span>Continue shopping</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
