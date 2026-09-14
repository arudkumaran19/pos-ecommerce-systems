import { Search, X } from "lucide-react"

export type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock"

type ProductToolbarProps = {
    search: string
    onSearchChange: (value: string) => void
    stockFilter: StockFilter
    onStockFilterChange: (value: StockFilter) => void
}

const filterOptions: { id: StockFilter; label: string; dot?: string }[] = [
    { id: "all", label: "All Items" },
    { id: "in-stock", label: "In Stock", dot: "bg-emerald-500" },
    { id: "low-stock", label: "Low Stock", dot: "bg-amber-500" },
    { id: "out-of-stock", label: "Out of Stock", dot: "bg-rose-400" },
]

export function ProductToolbar({
    search,
    onSearchChange,
    stockFilter,
    onStockFilterChange,
}: ProductToolbarProps) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input with Clear Button */}
            <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />

                <input
                    type="text"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search coffee, pastries, blends..."
                    aria-label="Search products"
                    className="h-10.5 w-full rounded-xl border border-stone-200/90 bg-white pl-10 pr-9 text-sm text-stone-900 outline-none transition-all placeholder:text-stone-400 focus:border-amber-600/60 focus:bg-white focus:ring-3 focus:ring-amber-500/15 shadow-xs"
                />

                {search && (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => onSearchChange("")}
                        className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                    >
                        <X className="size-3.5" />
                    </button>
                )}
            </div>

            {/* Filter Segmented Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {filterOptions.map((opt) => {
                    const active = stockFilter === opt.id

                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onStockFilterChange(opt.id)}
                            className={[
                                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-all duration-150 active:scale-95",
                                active
                                    ? "bg-stone-900 text-white shadow-sm ring-1 ring-stone-900"
                                    : "border border-stone-200/90 bg-white/90 text-stone-600 hover:border-stone-300 hover:bg-stone-100/80 hover:text-stone-900 shadow-2xs",
                            ].join(" ")}
                        >
                            {opt.dot && (
                                <span
                                    className={[
                                        "size-1.5 rounded-full shrink-0",
                                        opt.dot,
                                    ].join(" ")}
                                />
                            )}
                            {opt.label}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}