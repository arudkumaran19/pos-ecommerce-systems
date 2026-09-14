import { Filter, Search, SlidersHorizontal } from "lucide-react"

export type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock"

type ProductToolbarProps = {
    search: string
    onSearchChange: (value: string) => void
    stockFilter: StockFilter
    onStockFilterChange: (value: StockFilter) => void
}

export function ProductToolbar({
                                   search,
                                   onSearchChange,
                                   stockFilter,
                                   onStockFilterChange,
                               }: ProductToolbarProps) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-xl">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />

                <input
                    type="search"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search products..."
                    aria-label="Search products"
                    className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                />
            </div>

            <div className="flex items-center gap-2">
                <div className="relative">
                    <Filter className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />

                    <select
                        value={stockFilter}
                        onChange={(event) =>
                            onStockFilterChange(
                                event.target.value as StockFilter,
                            )
                        }
                        aria-label="Filter by stock status"
                        className="h-10 appearance-none rounded-xl border border-zinc-200 bg-white pl-9 pr-8 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    >
                        <option value="all">All products</option>
                        <option value="in-stock">In stock</option>
                        <option value="low-stock">Low stock</option>
                        <option value="out-of-stock">Out of stock</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        onStockFilterChange(
                            stockFilter === "all" ? "in-stock" : "all",
                        )
                    }
                    aria-label="Toggle stock filter"
                    className={[
                        "flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors",
                        stockFilter !== "all"
                            ? "border-zinc-950 bg-zinc-950 text-white"
                            : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
                    ].join(" ")}
                >
                    <SlidersHorizontal className="size-3.5" />
                    <span className="hidden sm:inline">Filters</span>
                </button>
            </div>
        </div>
    )
}