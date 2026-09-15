import React, { useState, useEffect } from 'react';
import { Sparkles, ShoppingBag } from 'lucide-react';
import { Product, PaginatedResponse } from '../../types';
import { apiRequest } from '../../lib/api-client';
import { ProductCard } from '../../components/storefront/ProductCard';
import { ProductFilters } from '../../components/storefront/ProductFilters';
import { ProductCardSkeleton } from '../../components/common/Skeleton';

export const StorePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('q', search);
        if (category) params.set('category', category);
        if (inStockOnly) params.set('in_stock_only', 'true');
        params.set('sort', sortBy);
        params.set('limit', '50');

        const data = await apiRequest<PaginatedResponse<Product>>(`/api/v1/products?${params.toString()}`);
        setProducts(data.items);

        // Extract unique categories from initial load
        if (categories.length === 0 && data.items.length > 0) {
          const unique = Array.from(new Set(data.items.map((p) => p.category)));
          setCategories(unique);
        }
      } catch (err) {
        console.error('Failed to load catalog products', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchProducts();
    }, 250);

    return () => clearTimeout(debounce);
  }, [search, category, inStockOnly, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel p-8 md:p-12 mb-12 border border-slate-800/80 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Exclusive Modern Collection
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Curated Gear, <span className="text-gradient">Ready When You Are</span>
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            Experience guaranteed availability, seamless checkout, and secure order processing.
          </p>
        </div>
      </div>

      {/* Catalog Filters */}
      <ProductFilters
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
        inStockOnly={inStockOnly}
        onInStockChange={setInStockOnly}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 glass-panel rounded-2xl border border-slate-800">
          <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No products found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query, price filter, or category selection.
          </p>
        </div>
      )}
    </div>
  );
};
