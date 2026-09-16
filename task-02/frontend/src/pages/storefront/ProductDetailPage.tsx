import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, RotateCcw, Check } from 'lucide-react';
import { Product } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency, formatProductName } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LoadingScreen } from '../../components/common/LoadingScreen';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [adding, setAdding] = useState<boolean>(false);
  const [added, setAdded] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Product>(`/api/v1/products/${slug}`);
        setProduct(data);
      } catch {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug, navigate]);

  if (loading || !product) {
    return <LoadingScreen message="Loading product…" submessage="Please wait a moment" />;
  }

  const isOutOfStock = product.available_stock <= 0;
  const isLowStock = product.available_stock > 0 && product.available_stock <= 3;
  const displayName = formatProductName(product.name);

  const handleAddToCart = async () => {
    if (!user) {
      toast.info('Please sign in to add items to your cart.');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      setErrorMsg(null);
      await addItem(product.id, quantity);
      setAdded(true);
      toast.success(`${quantity}× ${displayName} added to your cart.`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err: any) {
      const msg = err.message || 'Failed to add item to cart.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-[#A5ABB5] hover:text-[#F5F3EE] mb-8 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to products</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-[#10131A] p-6 sm:p-10 rounded-2xl border border-[#242A35]">
        {/* Gallery Image */}
        <div className="rounded-xl overflow-hidden aspect-[4/3] bg-[#080A0F] border border-[#242A35] relative">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
            alt={displayName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider bg-[#151922] text-[#A5ABB5] border border-[#242A35]">
                {product.category}
              </span>
              {isOutOfStock ? (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Sold out
                </span>
              ) : isLowStock ? (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Only {product.available_stock} left
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wider bg-[#151922] text-[#4FB7A5] border border-[#242A35]">
                  In stock
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] tracking-tight">
              {displayName}
            </h1>

            <div className="mt-3 text-2xl font-bold text-[#F5F3EE]">
              {formatCurrency(product.price)}
            </div>

            <p className="mt-5 text-xs sm:text-sm text-[#A5ABB5] leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#242A35]">
            {/* Quantity Selector & Add Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-[#242A35] bg-[#080A0F] rounded-lg overflow-hidden">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-xs text-[#A5ABB5] hover:text-[#F5F3EE] disabled:opacity-40 transition-colors cursor-pointer"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="px-3 text-xs font-semibold text-[#F5F3EE] min-w-[2rem] text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.available_stock || isOutOfStock}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2.5 text-xs text-[#A5ABB5] hover:text-[#F5F3EE] disabled:opacity-40 transition-colors cursor-pointer"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock || adding}
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isOutOfStock
                    ? 'bg-[#151922] text-[#6F7682] cursor-not-allowed border border-[#242A35]'
                    : added
                    ? 'bg-[#4FB7A5] text-[#080A0F]'
                    : 'bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F]'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Added to cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" />
                    <span>{isOutOfStock ? 'Sold out' : 'Add to cart'}</span>
                  </>
                )}
              </button>
            </div>

            {errorMsg && (
              <p className="mt-3 text-xs text-rose-400 font-medium">
                {errorMsg}
              </p>
            )}

            {/* Assurance Badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#242A35] text-center text-[11px] text-[#A5ABB5]">
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#4FB7A5]" />
                <span>Free delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#4FB7A5]" />
                <span>2-year warranty</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-[#4FB7A5]" />
                <span>30-day returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
