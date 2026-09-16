import React, { useState, useEffect } from 'react';
import { Truck, ShieldCheck, RefreshCw } from 'lucide-react';
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
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => clearTimeout(debounce);
  }, [search, category, inStockOnly, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Restrained Editorial Hero Banner */}
      <div className="rounded-2xl bg-[#10131A] p-8 md:p-12 mb-10 border border-[#242A35]">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#4FB7A5] block mb-3">
            TechLoom Collection
          </span>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#F5F3EE] leading-tight">
            Refined tools for focused work.
          </h1>

          <p className="mt-3 text-xs sm:text-sm text-[#A5ABB5] leading-relaxed">
            Thoughtfully designed hardware and desk accessories crafted for longevity, precision, and everyday utility.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-5 text-xs text-[#A5ABB5] pt-4 border-t border-[#242A35]">
            <div className="flex items-center gap-2">
              <Truck className="w-3.5 h-3.5 text-[#4FB7A5]" />
              <span>Free delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#4FB7A5]" />
              <span>2-year warranty</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-[#4FB7A5]" />
              <span>30-day returns</span>
            </div>
          </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-[#10131A] rounded-2xl border border-[#242A35] max-w-md mx-auto">
          <p className="text-sm font-semibold text-[#F5F3EE]">No products found</p>
          <p className="text-xs text-[#A5ABB5] mt-1">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};
