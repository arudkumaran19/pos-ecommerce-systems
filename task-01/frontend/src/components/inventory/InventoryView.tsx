import { useEffect, useMemo, useState } from "react"
import { Toast } from "../ui/Toast"
import {
    AlertTriangle,
    Edit3,
    Package,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
} from "lucide-react"
import {
    createProduct,
    deleteProduct,
    getProducts,
    updateProduct,
    type Product,
} from "../../lib/api"

type ProductForm = {
    name: string
    price: string
    available_stock: string
}

const emptyForm: ProductForm = {
    name: "",
    price: "",
    available_stock: "",
}

function getStockLabel(stock: number) {
    if (stock === 0) return "Out of stock"
    if (stock <= 5) return "Low stock"
    return "In stock"
}

function getStockClasses(stock: number) {
    if (stock === 0) {
        return "bg-red-50 text-red-700 ring-red-200"
    }

    if (stock <= 5) {
        return "bg-amber-50 text-amber-700 ring-amber-200"
    }

    return "bg-emerald-50 text-emerald-700 ring-emerald-200"
}

function formatPrice(price: string) {
    const numericPrice = Number(price)

    if (Number.isNaN(numericPrice)) {
        return price
    }

    return `$${numericPrice.toFixed(2)}`
}

export function InventoryView() {
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [form, setForm] = useState<ProductForm>(emptyForm)
    const [formError, setFormError] = useState("")

    async function loadProducts() {
        setLoading(true)
        setError("")

        try {
            const data = await getProducts()
            setProducts(data)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load products.",
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        void loadProducts()
    }, [])

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase()

        if (!query) {
            return products
        }

        return products.filter((product) =>
            product.name.toLowerCase().includes(query),
        )
    }, [products, search])

    const totalStock = useMemo(
        () =>
            products.reduce(
                (total, product) => total + product.available_stock,
                0,
            ),
        [products],
    )

    const lowStockCount = useMemo(
        () =>
            products.filter(
                (product) =>
                    product.available_stock > 0 &&
                    product.available_stock <= 5,
            ).length,
        [products],
    )

    const outOfStockCount = useMemo(
        () =>
            products.filter(
                (product) => product.available_stock === 0,
            ).length,
        [products],
    )

    function openCreateForm() {
        setEditingProduct(null)
        setForm(emptyForm)
        setFormError("")
        setIsFormOpen(true)
    }

    function openEditForm(product: Product) {
        setEditingProduct(product)

        setForm({
            name: product.name,
            price: product.price,
            available_stock: String(product.available_stock),
        })

        setFormError("")
        setIsFormOpen(true)
    }

    function closeForm() {
        if (saving) return

        setIsFormOpen(false)
        setEditingProduct(null)
        setForm(emptyForm)
        setFormError("")
    }

    function updateForm(
        field: keyof ProductForm,
        value: string,
    ) {
        setForm((current) => ({
            ...current,
            [field]: value,
        }))

        setFormError("")
    }

    function validateForm() {
        const name = form.name.trim()
        const price = Number(form.price)
        const stock = Number(form.available_stock)

        if (!name) {
            return "Product name is required."
        }

        if (!Number.isFinite(price) || price <= 0) {
            return "Price must be greater than 0."
        }

        if (!Number.isInteger(stock) || stock < 0) {
            return "Available stock must be a whole number of 0 or greater."
        }

        return null
    }

    async function handleSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault()

        const validationError = validateForm()

        if (validationError) {
            setFormError(validationError)
            return
        }

        setSaving(true)
        setFormError("")
        setError("")
        setSuccessMessage("")

        try {
            const payload = {
                name: form.name.trim(),
                price: Number(form.price),
                available_stock: Number(form.available_stock),
            }

            if (editingProduct) {
                await updateProduct(editingProduct.id, payload)

                setSuccessMessage(
                    `Product "${payload.name}" was updated successfully.`,
                )
            } else {
                await createProduct(payload)

                setSuccessMessage(
                    `Product "${payload.name}" was created successfully.`,
                )
            }

            setIsFormOpen(false)
            setEditingProduct(null)
            setForm(emptyForm)

            await loadProducts()
        } catch (err) {
            setFormError(
                err instanceof Error
                    ? err.message
                    : "Unable to save the product.",
            )
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(product: Product) {
        const confirmed = window.confirm(
            `Delete "${product.name}"?\n\nThis action cannot be undone.`,
        )

        if (!confirmed) return

        setDeletingId(product.id)
        setError("")
        setSuccessMessage("")

        try {
            await deleteProduct(product.id)

            setProducts((current) =>
                current.filter(
                    (item) => item.id !== product.id,
                ),
            )

            setSuccessMessage(
                `Product "${product.name}" was deleted successfully.`,
            )
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to delete the product.",
            )
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Package className="size-5 text-zinc-700" />

                            <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
                                Inventory
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                            Manage products and monitor current stock levels.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => void loadProducts()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                className={[
                                    "size-4",
                                    loading ? "animate-spin" : "",
                                ].join(" ")}
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800"
                        >
                            <Plus className="size-4" />
                            Add product
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-zinc-500">
                            Products
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-zinc-950">
                            {products.length}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-zinc-500">
                            Total units
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-zinc-950">
                            {totalStock}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-zinc-500">
                            Stock alerts
                        </p>

                        <p className="mt-2 text-2xl font-semibold text-zinc-950">
                            {lowStockCount + outOfStockCount}
                        </p>

                        <p className="mt-1 text-xs text-zinc-400">
                            {lowStockCount} low · {outOfStockCount} out
                        </p>
                    </div>
                </div>


                {error && (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-zinc-950">
                                Products
                            </h2>

                            <p className="mt-0.5 text-xs text-zinc-500">
                                {filteredProducts.length} of{" "}
                                {products.length} products
                            </p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                            <input
                                type="search"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search products..."
                                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex min-h-80 items-center justify-center">
                            <div className="text-center">
                                <RefreshCw className="mx-auto size-6 animate-spin text-zinc-400" />

                                <p className="mt-3 text-sm text-zinc-500">
                                    Loading inventory...
                                </p>
                            </div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex min-h-80 items-center justify-center px-6">
                            <div className="text-center">
                                <Package className="mx-auto size-8 text-zinc-300" />

                                <p className="mt-3 text-sm font-semibold text-zinc-900">
                                    {search
                                        ? "No matching products"
                                        : "No products yet"}
                                </p>

                                <p className="mt-1 text-sm text-zinc-500">
                                    {search
                                        ? "Try a different search term."
                                        : "Add your first product to get started."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] text-left">
                                <thead>
                                <tr className="border-b border-zinc-200 bg-zinc-50/70">
                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Product
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Price
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Current stock
                                    </th>

                                    <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">
                                        Actions
                                    </th>
                                </tr>
                                </thead>

                                <tbody className="divide-y divide-zinc-100">
                                {filteredProducts.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="transition hover:bg-zinc-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 items-center justify-center rounded-xl bg-zinc-100">
                                                    <Package className="size-4 text-zinc-500" />
                                                </div>

                                                <div>
                                                    <p className="text-sm font-medium text-zinc-950">
                                                        {product.name}
                                                    </p>

                                                    <p className="text-xs text-zinc-400">
                                                        Product #{product.id}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-sm font-medium text-zinc-900">
                                            {formatPrice(product.price)}
                                        </td>

                                        <td className="px-5 py-4">
                                                <span className="text-sm font-semibold text-zinc-950">
                                                    {product.available_stock}
                                                </span>

                                            <span className="ml-1 text-xs text-zinc-400">
                                                    units
                                                </span>
                                        </td>

                                        <td className="px-5 py-4">
                                                <span
                                                    className={[
                                                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
                                                        getStockClasses(
                                                            product.available_stock,
                                                        ),
                                                    ].join(" ")}
                                                >
                                                    {getStockLabel(
                                                        product.available_stock,
                                                    )}
                                                </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEditForm(
                                                            product,
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100"
                                                >
                                                    <Edit3 className="size-3.5" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        void handleDelete(
                                                            product,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingId ===
                                                        product.id
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    <Trash2 className="size-3.5" />

                                                    {deletingId ===
                                                    product.id
                                                        ? "Deleting..."
                                                        : "Delete"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
                            <div>
                                <h2 className="font-semibold text-zinc-950">
                                    {editingProduct
                                        ? "Edit product"
                                        : "Add product"}
                                </h2>

                                <p className="mt-0.5 text-xs text-zinc-500">
                                    Enter the product details below.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-50"
                                aria-label="Close"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            {formError && (
                                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {formError}
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="product-name"
                                    className="mb-1.5 block text-sm font-medium text-zinc-800"
                                >
                                    Product name
                                </label>

                                <input
                                    id="product-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(event) =>
                                        updateForm(
                                            "name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. Cappuccino"
                                    disabled={saving}
                                    className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:bg-zinc-50"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="product-price"
                                        className="mb-1.5 block text-sm font-medium text-zinc-800"
                                    >
                                        Price
                                    </label>

                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                                            $
                                        </span>

                                        <input
                                            id="product-price"
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={form.price}
                                            onChange={(event) =>
                                                updateForm(
                                                    "price",
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="0.00"
                                            disabled={saving}
                                            className="w-full rounded-xl border border-zinc-200 py-2.5 pl-8 pr-3.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:bg-zinc-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="product-stock"
                                        className="mb-1.5 block text-sm font-medium text-zinc-800"
                                    >
                                        Available stock
                                    </label>

                                    <input
                                        id="product-stock"
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.available_stock}
                                        onChange={(event) =>
                                            updateForm(
                                                "available_stock",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="0"
                                        disabled={saving}
                                        className="w-full rounded-xl border border-zinc-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 disabled:bg-zinc-50"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 border-t border-zinc-100 pt-5">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50"
                                >
                                    {saving && (
                                        <RefreshCw className="size-4 animate-spin" />
                                    )}

                                    {editingProduct
                                        ? "Save changes"
                                        : "Create product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <Toast
                message={successMessage || null}
                variant="success"
                duration={5000}
                onClose={() => setSuccessMessage("")}
            />
        </div>
    )
}