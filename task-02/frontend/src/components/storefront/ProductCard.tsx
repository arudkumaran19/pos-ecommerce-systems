import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, AlertCircle } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOutOfStock = product.available_stock <= 0;
  const isLowStock = product.available_stock > 0 && product.available_stock <= 3;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      setErrorMsg(null);
      await addItem(product.id, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add item to cart');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col group transition-all duration-300">
      {/* Image Container */}
      <Link to={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-slate-900 block">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        
        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-slate-950/80 backdrop-blur-md text-slate-300 border border-white/10">
          {product.category}
        </span>

        {/* Stock Meter Badge */}
        <div className="absolute top-3 right-3">
          {isOutOfStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full bg-rose-500/90 text-white shadow-md">
              Sold Out
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase rounded-full bg-amber-500/90 text-slate-950 shadow-md animate-pulse">
              Only {product.available_stock} Left
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase rounded-full bg-emerald-500/80 backdrop-blur-md text-slate-950">
              {product.available_stock} in Stock
            </span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-medium">
              Price
            </span>
            <span className="text-lg font-extrabold text-white">
              {formatCurrency(product.price)}
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock || adding}
            onClick={handleAddToCart}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : added
                ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 hover:shadow-emerald-500/30'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Added
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                {isOutOfStock ? 'Unavailable' : 'Add to Cart'}
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};
