import { useEffect, useMemo, useState } from "react"
import { Toast } from "../ui/Toast"
import {
    AlertTriangle,
    Archive,
    Boxes,
    Edit3,
    Package,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
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
        return "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200"
    }

    if (stock <= 5) {
        return "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200"
    }

    return "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200"
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
    type InventoryStatusFilter = "all" | "active" | "archived"

    const [statusFilter, setStatusFilter] =
        useState<InventoryStatusFilter>("all")
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [archivingId, setArchivingId] = useState<number | null>(null)

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
        let ignore = false

        const fetchLatest = (isInitial = false) => {
            getProducts()
                .then((data) => {
                    if (!ignore) {
                        setProducts(data)
                        if (isInitial) {
                            setLoading(false)
                        }
                    }
                })
                .catch((err) => {
                    if (!ignore) {
                        if (isInitial) {
                            setError(
                                err instanceof Error
                                    ? err.message
                                    : "Unable to load products.",
                            )
                            setLoading(false)
                        }
                    }
                })
        }

        fetchLatest(true)

        // Silent auto-refresh every 4 seconds and on focus so stock reservations and expirations update live
        const intervalId = setInterval(() => fetchLatest(false), 4000)
        const onFocus = () => fetchLatest(false)
        window.addEventListener("focus", onFocus)

        return () => {
            ignore = true
            clearInterval(intervalId)
            window.removeEventListener("focus", onFocus)
        }
    }, [])

    const filteredProducts = useMemo(() => {
        const query = search.trim().toLowerCase()

        return products.filter((product) => {
            const matchesSearch =
                !query ||
                product.name.toLowerCase().includes(query)

            const matchesStatus =
                statusFilter === "all"
                    ? true
                    : statusFilter === "active"
                        ? product.is_active
                        : !product.is_active

            return matchesSearch && matchesStatus
        })
    }, [products, search, statusFilter])

    const activeProducts = useMemo(
        () => products.filter((product) => product.is_active),
        [products],
    )

    const archivedProducts = useMemo(
        () => products.filter((product) => !product.is_active),
        [products],
    )

    const activeStock = useMemo(
        () =>
            activeProducts.reduce(
                (total, product) => total + product.available_stock,
                0,
            ),
        [activeProducts],
    )

    const lowStockCount = useMemo(
        () =>
            activeProducts.filter(
                (product) =>
                    product.available_stock > 0 &&
                    product.available_stock <= 5,
            ).length,
        [activeProducts],
    )

    const outOfStockCount = useMemo(
        () =>
            activeProducts.filter(
                (product) => product.available_stock === 0,
            ).length,
        [activeProducts],
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

    async function handleArchiveToggle(product: Product) {
        const nextIsActive = !product.is_active
        const action = nextIsActive ? "restore" : "archive"

        const confirmed = window.confirm(
            nextIsActive
                ? `Restore "${product.name}"?\n\nThis will make the product available for sale again.`
                : `Archive "${product.name}"?\n\nThis will remove the product from the POS catalog, but keep its history.`,
        )

        if (!confirmed) return

        setArchivingId(product.id)
        setError("")
        setSuccessMessage("")

        try {
            await updateProduct(product.id, {
                is_active: nextIsActive,
            })

            setProducts((current) =>
                current.map((item) =>
                    item.id === product.id
                        ? {
                            ...item,
                            is_active: nextIsActive,
                        }
                        : item,
                ),
            )

            setSuccessMessage(
                nextIsActive
                    ? `Product "${product.name}" was restored successfully.`
                    : `Product "${product.name}" was archived successfully.`,
            )
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : `Unable to ${action} the product.`,
            )
        } finally {
            setArchivingId(null)
        }
    }

    return (
        <div className="p-6 lg:p-8 space-y-6">
            <div className="mx-auto max-w-7xl">
                {/* Header with Title and Quick Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                <Package className="size-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-2xl font-bold tracking-tight text-stone-900">
                                        Inventory Control
                                    </h1>
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Live Sync (4s)
                                    </span>
                                </div>
                                <p className="text-xs text-stone-500 mt-0.5">
                                    Real-time inventory levels, dynamic stock reservations, and catalog management.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => void loadProducts()}
                            disabled={loading}
                            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 hover:border-stone-300 transition-all disabled:opacity-50 cursor-pointer"
                        >
                            <RefreshCw
                                className={[
                                    "size-3.5",
                                    loading ? "animate-spin text-amber-600" : "text-stone-500",
                                ].join(" ")}
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition-all cursor-pointer active:scale-98"
                        >
                            <Plus className="size-4 text-amber-400" />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Dashboard Cards */}
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {/* Active Products */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-stone-300/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Active Products</span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                <Package className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-stone-900 tnum">
                                {activeProducts.length}
                            </span>
                            <span className="text-xs text-stone-400">items</span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                            Available in POS register catalog
                        </p>
                    </div>

                    {/* Archived Products */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-stone-300/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Archived Items</span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-stone-100 text-stone-500 border border-stone-200">
                                <Archive className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-stone-900 tnum">
                                {archivedProducts.length}
                            </span>
                            <span className="text-xs text-stone-400">items</span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                            Preserved for reporting & audit history
                        </p>
                    </div>

                    {/* Total Active Units */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-stone-300/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Active Units</span>
                            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                                <Boxes className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-stone-900 tnum">
                                {activeStock}
                            </span>
                            <span className="text-xs text-stone-400">units in shelf</span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                            Unreserved stock ready for sale
                        </p>
                    </div>

                    {/* Stock Alerts */}
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-stone-300/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-stone-500 uppercase tracking-wider">Stock Alerts</span>
                            <div className={[
                                "flex size-8 items-center justify-center rounded-lg border",
                                lowStockCount + outOfStockCount > 0
                                    ? "bg-rose-50 text-rose-600 border-rose-100"
                                    : "bg-stone-50 text-stone-400 border-stone-200",
                            ].join(" ")}>
                                <AlertTriangle className="size-4" />
                            </div>
                        </div>
                        <div className="mt-3 flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-stone-900 tnum">
                                {lowStockCount + outOfStockCount}
                            </span>
                            <span className="text-xs text-stone-400">attention required</span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                            {lowStockCount} low stock · {outOfStockCount} depleted
                        </p>
                    </div>
                </div>

                {/* Main Product Table & Filter Card */}
                <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-xs">
                    <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-stone-50/40">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-stone-900">
                                Product Catalog
                            </span>
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 border border-stone-200/60 tnum">
                                {filteredProducts.length} of {products.length} products
                            </span>
                        </div>

                        <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
                            {/* Search Input */}
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search products..."
                                    className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-9 pr-8 text-xs outline-none transition placeholder:text-stone-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                                />
                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                                    >
                                        <X className="size-3.5" />
                                    </button>
                                )}
                            </div>

                            {/* Status Filter Tabs / Select */}
                            <div className="flex rounded-xl border border-stone-200 bg-white p-0.5 shadow-2xs">
                                {(
                                    [
                                        { id: "all", label: "All", count: products.length },
                                        { id: "active", label: "Active", count: activeProducts.length },
                                        { id: "archived", label: "Archived", count: archivedProducts.length },
                                    ] as const
                                ).map((tab) => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setStatusFilter(tab.id)}
                                        className={[
                                            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
                                            statusFilter === tab.id
                                                ? "bg-stone-900 text-white shadow-2xs"
                                                : "text-stone-600 hover:text-stone-900 hover:bg-stone-50",
                                        ].join(" ")}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={[
                                            "text-[10px] rounded-full px-1.5 py-0.2 tnum",
                                            statusFilter === tab.id
                                                ? "bg-stone-800 text-stone-300"
                                                : "bg-stone-100 text-stone-500",
                                        ].join(" ")}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Table or Empty States */}
                    {loading ? (
                        <div className="flex min-h-80 items-center justify-center">
                            <div className="text-center">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-2xs">
                                    <RefreshCw className="size-6 animate-spin" />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-stone-800">
                                    Synchronizing Inventory...
                                </p>
                                <p className="mt-1 text-xs text-stone-400">
                                    Fetching current product stock and reservation states
                                </p>
                            </div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="flex min-h-80 items-center justify-center px-6">
                            <div className="text-center max-w-sm">
                                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400 border border-stone-200/80">
                                    <Package className="size-7" />
                                </div>

                                <p className="mt-4 text-sm font-semibold text-stone-900">
                                    {search || statusFilter !== "all"
                                        ? "No matching products found"
                                        : "No products in catalog"}
                                </p>

                                <p className="mt-1 text-xs text-stone-500 leading-relaxed">
                                    {search
                                        ? `No products matched "${search}". Try searching by another keyword or reset the filter.`
                                        : statusFilter === "archived"
                                            ? "There are currently no archived products in the system."
                                            : statusFilter === "active"
                                                ? "There are no active products in the POS catalog."
                                                : "Create your first product to start taking orders in the POS."}
                                </p>

                                {(search || statusFilter !== "all") ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearch("")
                                            setStatusFilter("all")
                                        }}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-700 shadow-xs hover:bg-stone-50 transition cursor-pointer"
                                    >
                                        <X className="size-3.5" />
                                        Clear Search & Filters
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={openCreateForm}
                                        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-stone-800 transition cursor-pointer"
                                    >
                                        <Plus className="size-3.5 text-amber-400" />
                                        Add First Product
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left">
                                <thead>
                                    <tr className="border-b border-stone-100 bg-stone-50/75 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                                        <th className="px-5 py-3.5">
                                            Product
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Price
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Current Stock
                                        </th>
                                        <th className="px-5 py-3.5">
                                            Catalog Status
                                        </th>
                                        <th className="px-5 py-3.5 text-right">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-stone-100">
                                    {filteredProducts.map((product) => {
                                        const stockClasses = getStockClasses(product.available_stock)
                                        const stockLabel = getStockLabel(product.available_stock)

                                        return (
                                            <tr
                                                key={product.id}
                                                className="transition-colors hover:bg-amber-50/20 group"
                                            >
                                                {/* Product Details */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/60 border border-amber-200/50 text-amber-800 shadow-2xs font-semibold text-xs shrink-0">
                                                            {product.name.slice(0, 2).toUpperCase()}
                                                        </div>

                                                        <div>
                                                            <p className="text-sm font-semibold text-stone-900 group-hover:text-amber-900 transition-colors">
                                                                {product.name}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[11px] font-medium text-stone-400 tnum">
                                                                    ID #{product.id}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Price */}
                                                <td className="px-5 py-4">
                                                    <span className="text-sm font-bold text-stone-900 tnum">
                                                        {formatPrice(product.price)}
                                                    </span>
                                                </td>

                                                {/* Stock Health */}
                                                <td className="px-5 py-4">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className={[
                                                                "text-sm font-bold tnum",
                                                                product.available_stock === 0
                                                                    ? "text-rose-600"
                                                                    : product.available_stock <= 5
                                                                        ? "text-amber-700"
                                                                        : "text-stone-900",
                                                            ].join(" ")}>
                                                                {product.available_stock}
                                                            </span>
                                                            <span className="text-xs text-stone-400">units available</span>
                                                        </div>

                                                        {/* Visual mini stock bar */}
                                                        <div className="h-1.5 w-28 rounded-full bg-stone-100 overflow-hidden">
                                                            <div
                                                                className={[
                                                                    "h-full rounded-full transition-all",
                                                                    product.available_stock === 0
                                                                        ? "bg-rose-500 w-0"
                                                                        : product.available_stock <= 5
                                                                            ? "bg-amber-500"
                                                                            : "bg-emerald-500",
                                                                ].join(" ")}
                                                                style={{
                                                                    width: `${Math.min(100, Math.max(8, product.available_stock * 5))}%`,
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status Badges */}
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span
                                                            className={[
                                                                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border",
                                                                product.is_active
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                                                                    : "bg-stone-100 text-stone-600 border-stone-200/80",
                                                            ].join(" ")}
                                                        >
                                                            <span
                                                                className={[
                                                                    "size-1.5 rounded-full",
                                                                    product.is_active ? "bg-emerald-500" : "bg-stone-400",
                                                                ].join(" ")}
                                                            />
                                                            {product.is_active ? "Active" : "Archived"}
                                                        </span>

                                                        {product.is_active && (
                                                            <span
                                                                className={[
                                                                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border",
                                                                    stockClasses,
                                                                ].join(" ")}
                                                            >
                                                                {stockLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* Edit button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditForm(product)}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 hover:border-stone-300 transition cursor-pointer"
                                                        >
                                                            <Edit3 className="size-3.5 text-stone-500" />
                                                            Edit
                                                        </button>

                                                        {/* Archive / Restore button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleArchiveToggle(product)}
                                                            disabled={
                                                                archivingId === product.id ||
                                                                deletingId === product.id
                                                            }
                                                            className={[
                                                                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer disabled:opacity-50",
                                                                product.is_active
                                                                    ? "border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100/60"
                                                                    : "border-emerald-200 bg-emerald-50/50 text-emerald-800 hover:bg-emerald-100/60",
                                                            ].join(" ")}
                                                        >
                                                            {archivingId === product.id ? (
                                                                <RefreshCw className="size-3.5 animate-spin" />
                                                            ) : product.is_active ? (
                                                                <Archive className="size-3.5" />
                                                            ) : (
                                                                <RefreshCw className="size-3.5" />
                                                            )}

                                                            {archivingId === product.id
                                                                ? product.is_active
                                                                    ? "Archiving..."
                                                                    : "Restoring..."
                                                                : product.is_active
                                                                    ? "Archive"
                                                                    : "Restore"}
                                                        </button>

                                                        {/* Delete button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleDelete(product)}
                                                            disabled={deletingId === product.id}
                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50/30 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100/60 transition cursor-pointer disabled:opacity-50"
                                                        >
                                                            <Trash2 className="size-3.5" />
                                                            {deletingId === product.id ? "Deleting..." : "Delete"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal / Dialog for Create or Edit Product */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="w-full max-w-lg rounded-2xl border border-stone-200/80 bg-white shadow-2xl overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                    {editingProduct ? (
                                        <Edit3 className="size-4" />
                                    ) : (
                                        <Sparkles className="size-4 text-amber-500" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-900">
                                        {editingProduct
                                            ? `Edit "${editingProduct.name}"`
                                            : "Add New Product"}
                                    </h2>
                                    <p className="text-xs text-stone-500">
                                        {editingProduct
                                            ? "Update product details, pricing, and stock inventory."
                                            : "Add a brand new item to the POS catalog."}
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition disabled:opacity-50 cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5 p-6"
                        >
                            {formError && (
                                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
                                    <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                                    <span>{formError}</span>
                                </div>
                            )}

                            <div>
                                <label
                                    htmlFor="product-name"
                                    className="mb-1.5 block text-xs font-bold text-stone-700 uppercase tracking-wider"
                                >
                                    Product Name
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
                                    placeholder="e.g. Vanilla Bean Latte"
                                    disabled={saving}
                                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-stone-100"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="product-price"
                                        className="mb-1.5 block text-xs font-bold text-stone-700 uppercase tracking-wider"
                                    >
                                        Price (USD)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-stone-400">
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
                                            placeholder="4.50"
                                            disabled={saving}
                                            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pl-8 pr-3.5 text-sm font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-stone-100 tnum"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="product-stock"
                                        className="mb-1.5 block text-xs font-bold text-stone-700 uppercase tracking-wider"
                                    >
                                        Available Units
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
                                        placeholder="25"
                                        disabled={saving}
                                        className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2.5 text-sm font-semibold text-stone-900 outline-none transition placeholder:text-stone-400 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 disabled:bg-stone-100 tnum"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2.5 border-t border-stone-100 pt-5">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 shadow-2xs hover:bg-stone-50 transition disabled:opacity-50 cursor-pointer"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition disabled:opacity-50 cursor-pointer active:scale-98"
                                >
                                    {saving && (
                                        <RefreshCw className="size-3.5 animate-spin text-amber-400" />
                                    )}

                                    {editingProduct
                                        ? "Save Changes"
                                        : "Create Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Error & Success Toasts */}
            <Toast
                message={error || null}
                variant="error"
                duration={3000}
                onClose={() => setError("")}
            />

            <Toast
                message={successMessage || null}
                variant="success"
                duration={3000}
                onClose={() => setSuccessMessage("")}
            />
        </div>
    )
}