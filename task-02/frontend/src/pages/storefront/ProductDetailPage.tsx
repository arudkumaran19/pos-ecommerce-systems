import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, ShieldCheck, Truck, RefreshCw, Check } from 'lucide-react';
import { Product } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { formatCurrency } from '../../lib/formatters';
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
      } catch (err) {
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug, navigate]);

  if (loading || !product) {
    return <LoadingScreen message="Loading Product Details..." submessage="Fetching real-time inventory and pricing" />;
  }

  const isOutOfStock = product.available_stock <= 0;
  const isLowStock = product.available_stock > 0 && product.available_stock <= 3;

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
      toast.success(`${quantity}x ${product.name} added to cart.`);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 glass-panel p-8 rounded-3xl border border-slate-800/80">
        {/* Gallery Image */}
        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-800">
          <img
            src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-slate-800 text-slate-300 border border-slate-700/60">
                {product.category}
              </span>
              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  Only {product.available_stock} Remaining
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  In Stock ({product.available_stock} units)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {product.name}
            </h1>

            <div className="mt-4 text-3xl font-extrabold text-white">
              {formatCurrency(product.price)}
            </div>

            <p className="mt-6 text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            {/* Quantity Selector & Add Button */}
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-slate-700 bg-slate-900 rounded-xl overflow-hidden">
                <button
                  type="button"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3.5 py-2.5 text-slate-400 hover:text-white disabled:opacity-40"
                >
                  -
                </button>
                <span className="px-3 text-sm font-bold text-white min-w-[2rem] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.available_stock || isOutOfStock}
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-3.5 py-2.5 text-slate-400 hover:text-white disabled:opacity-40"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                disabled={isOutOfStock || adding}
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer ${
                  isOutOfStock
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : added
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/30'
                }`}
              >
                {added ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    {isOutOfStock ? 'Sold Out' : 'Add to Cart'}
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
            <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-slate-800/80 text-center text-[11px] text-slate-400">
              <div className="flex flex-col items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Guaranteed Stock Hold</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>Tracked Dispatch</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                <span>Instant Refund Support</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
