import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { apiClient } from '../../lib/api-client';
import { Product, PaginatedResponse } from '../../types';
import { formatCurrency, formatProductName } from '../../lib/formatters';
import { useToast } from '../../context/ToastContext';

export const AdminProductsPage: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [_total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Electronics',
    price: '',
    available_stock: 10,
    description: '',
    image_url: '',
    is_active: true
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('query', search);
      if (categoryFilter) params.append('category', categoryFilter);

      const data = await apiClient.get<PaginatedResponse<Product>>(`/api/v1/admin/products?${params.toString()}`);
      setProducts(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Electronics',
      price: '',
      available_stock: 10,
      description: '',
      image_url: '',
      is_active: true
    });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      category: p.category,
      price: p.price,
      available_stock: p.available_stock,
      description: p.description || '',
      image_url: p.image_url || '',
      is_active: p.is_active
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingProduct) {
        await apiClient.patch(`/api/v1/admin/products/${editingProduct.id}`, {
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          available_stock: parseInt(formData.available_stock.toString()),
          description: formData.description,
          image_url: formData.image_url,
          is_active: formData.is_active
        });
        const editMsg = `Updated product: ${formData.name}`;
        setSuccessMsg(editMsg);
        toast.success(editMsg);
      } else {
        await apiClient.post('/api/v1/admin/products', {
          name: formData.name,
          category: formData.category,
          price: parseFloat(formData.price),
          available_stock: parseInt(formData.available_stock.toString()),
          description: formData.description,
          image_url: formData.image_url,
          is_active: formData.is_active
        });
        const createMsg = `Created new product: ${formData.name}`;
        setSuccessMsg(createMsg);
        toast.success(createMsg);
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      const errMsg = err.message || 'Failed to save product';
      setFormError(errMsg);
      toast.error(errMsg);
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F5F3EE] tracking-tight">Products</h1>
          <p className="text-[#A5ABB5] text-xs mt-0.5">
            Manage catalog items, pricing, and available inventory.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add product</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-[#151922] border border-[#4FB7A5]/30 text-[#4FB7A5] text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-[#10131A] p-3.5 rounded-xl border border-[#242A35] flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-[#6F7682] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#151922] border border-[#242A35] text-[#A5ABB5] text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#4FB7A5]"
          >
            <option value="">All categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Accessories">Accessories</option>
            <option value="Wearables">Wearables</option>
            <option value="Audio">Audio</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#10131A] rounded-xl border border-[#242A35] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#242A35] text-[11px] font-semibold text-[#A5ABB5] uppercase tracking-wider bg-[#151922]/50">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242A35] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A5ABB5]">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#4FB7A5] border-t-transparent mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#A5ABB5]">
                    No products found matching criteria.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.available_stock > 0 && p.available_stock <= 5;
                  const isOutOfStock = p.available_stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#151922]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
                            alt={formatProductName(p.name)}
                            className="w-9 h-9 rounded-lg object-cover bg-[#080A0F] border border-[#242A35] shrink-0"
                          />
                          <div>
                            <span className="font-semibold text-[#F5F3EE] block">{formatProductName(p.name)}</span>
                            <span className="text-[#6F7682] text-[11px] block">{p.slug}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#151922] text-[#A5ABB5] border border-[#242A35]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#F5F3EE] tabular-nums">
                        {formatCurrency(p.price)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs font-medium ${
                          isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-[#4FB7A5]'
                        }`}>
                          {p.available_stock} in stock
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          p.is_active
                            ? 'bg-[#151922] text-[#4FB7A5] border border-[#4FB7A5]/30'
                            : 'bg-[#151922] text-[#6F7682] border border-[#242A35]'
                        }`}>
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg border border-[#242A35] text-[#A5ABB5] hover:text-[#F5F3EE] hover:bg-[#151922] transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3.5 border-t border-[#242A35] flex items-center justify-between text-xs text-[#A5ABB5]">
            <span>Page {page} of {totalPages}</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1 rounded-lg bg-[#151922] border border-[#242A35] text-[#F5F3EE] disabled:opacity-40 hover:bg-[#1C222C]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#10131A] border border-[#242A35] max-w-lg w-full p-6 rounded-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#242A35] pb-3">
              <h3 className="font-bold text-[#F5F3EE] text-base">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-[#A5ABB5] hover:text-[#F5F3EE]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Product name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Wireless Headphones"
                  className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] focus:outline-none focus:border-[#4FB7A5]"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Wearables">Wearables</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Price (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="99.99"
                    className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Stock quantity</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.available_stock}
                  onChange={(e) => setFormData({ ...formData, available_stock: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Image URL</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#A5ABB5] block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Product description and details…"
                  className="w-full bg-[#080A0F] border border-[#242A35] rounded-lg px-3 py-2 text-xs text-[#F5F3EE] placeholder-[#6F7682] focus:outline-none focus:border-[#4FB7A5]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-[#242A35] bg-[#080A0F] text-[#4FB7A5] focus:ring-0"
                />
                <label htmlFor="is_active" className="text-xs text-[#A5ABB5] cursor-pointer">
                  Visible in store
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#242A35]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#151922] text-[#A5ABB5] text-xs font-medium hover:text-[#F5F3EE]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-3.5 py-1.5 rounded-lg bg-[#4FB7A5] hover:bg-[#43A090] text-[#080A0F] text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving…' : editingProduct ? 'Save changes' : 'Add product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
