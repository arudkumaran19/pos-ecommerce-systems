import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, formatProductName } from '../../lib/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const isOutOfStock = product.available_stock <= 0;
  const isLowStock = product.available_stock > 0 && product.available_stock <= 3;
  const displayName = formatProductName(product.name);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.info('Sign in to add items to your cart.');
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (isOutOfStock || adding) return;

    try {
      setAdding(true);
      await addItem(product.id, 1);
      setAdded(true);
      toast.success(`${displayName} added to your cart.`);
      setTimeout(() => setAdded(false), 2000);
    } catch {
      toast.error('Item couldn\'t be added. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-[#10131A] border border-[#242A35] rounded-xl overflow-hidden flex flex-col group transition-colors hover:border-[#323B4A]">
      {/* Product Image */}
      <Link to={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden bg-[#080A0F] block">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Category Pill */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider rounded-md bg-[#10131A]/90 text-[#A5ABB5] border border-[#242A35]">
          {product.category}
        </span>

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-rose-500/90 text-white">
            Sold out
          </span>
        ) : isLowStock ? (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-amber-500/90 text-[#080A0F]">
            Only {product.available_stock} left
          </span>
        ) : null}
      </Link>

      {/* Details */}
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          <Link to={`/products/${product.slug}`} className="block">
            <h3 className="font-semibold text-sm text-[#F5F3EE] hover:text-[#4FB7A5] transition-colors line-clamp-1 leading-snug">
              {displayName}
            </h3>
          </Link>
          <p className="text-xs text-[#A5ABB5] mt-1.5 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#242A35] flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-[#F5F3EE]">
              {formatCurrency(product.price)}
            </span>
            <span className="text-[11px] text-[#4FB7A5] block">
              {isOutOfStock ? 'Unavailable' : 'In stock'}
            </span>
          </div>

          <button
            type="button"
            disabled={isOutOfStock || adding}
            onClick={handleAddToCart}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              isOutOfStock
                ? 'bg-[#151922] text-[#6F7682] cursor-not-allowed border border-[#242A35]'
                : added
                ? 'bg-[#4FB7A5] text-[#080A0F]'
                : 'bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F]'
            }`}
          >
            {added ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <span>{isOutOfStock ? 'Sold out' : 'Add to cart'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
