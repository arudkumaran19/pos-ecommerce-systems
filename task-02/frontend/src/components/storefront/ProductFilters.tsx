import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (cat: string) => void;
  categories: string[];
  inStockOnly: boolean;
  onInStockChange: (val: boolean) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  inStockOnly,
  onInStockChange,
  sortBy,
  onSortChange,
}) => {
  return (
    <div className="space-y-4 mb-8">
      {/* Top row: Search Bar & Sort Dropdown */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6F7682]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-[#10131A] border border-[#242A35] text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5] transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* In-Stock Toggle */}
          <label className="flex items-center gap-2 text-xs text-[#A5ABB5] cursor-pointer select-none bg-[#10131A] px-3 py-2 rounded-lg border border-[#242A35] hover:border-[#323B4A] transition-colors">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="rounded border-[#242A35] text-[#4FB7A5] focus:ring-0 bg-[#080A0F] cursor-pointer"
            />
            <span className="font-medium">In stock only</span>
          </label>

          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              aria-label="Sort products"
              className="appearance-none bg-[#10131A] border border-[#242A35] text-[#A5ABB5] text-xs font-medium pl-3 pr-8 py-2 rounded-lg focus:outline-none focus:border-[#4FB7A5] cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
            </select>
            <ArrowUpDown className="w-3 h-3 text-[#6F7682] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => onCategoryChange('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
            category === ''
              ? 'bg-[#4FB7A5] text-[#080A0F] font-semibold'
              : 'bg-[#10131A] text-[#A5ABB5] border border-[#242A35] hover:text-[#F5F3EE] hover:border-[#323B4A]'
          }`}
        >
          All products
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              category === cat
                ? 'bg-[#4FB7A5] text-[#080A0F] font-semibold'
                : 'bg-[#10131A] text-[#A5ABB5] border border-[#242A35] hover:text-[#F5F3EE] hover:border-[#323B4A]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
