import { PackagePlus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

type ProductCardProps = {
    id: number
    name: string
    price: number
    stock: number
    image?: string
    onAddToCart?: (productId: number) => void
}

export function ProductCard({
    id,
    name,
    price,
    stock,
    image,
    onAddToCart,
}: ProductCardProps) {
    const isOutOfStock = stock <= 0
    const isLowStock = stock > 0 && stock <= 5

    return (
        <article
            onClick={() => {
                if (!isOutOfStock) {
                    onAddToCart?.(id)
                }
            }}
            className={[
                "group relative flex flex-col rounded-2xl border bg-white p-3.5 shadow-xs transition-all duration-200 select-none",
                isOutOfStock
                    ? "border-stone-200/70 opacity-75"
                    : "cursor-pointer border-stone-200/90 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-xl hover:shadow-stone-200/60",
            ].join(" ")}
        >
            {/* Image Showcase Container */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-gradient-to-br from-stone-100 via-stone-50 to-stone-200/60">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                ) : (
                    <div className="flex size-full items-center justify-center text-stone-300">
                        <PackagePlus className="size-10 transition-transform duration-300 group-hover:scale-110 group-hover:text-amber-600/50" />
                    </div>
                )}

                {/* Subtle dark vignette overlay at the bottom of image */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                {/* Floating Stock Status Badge */}
                <div className="absolute right-2 top-2 z-10">
                    <span
                        className={[
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs backdrop-blur-md transition-all",
                            isOutOfStock
                                ? "bg-stone-900/85 text-white"
                                : isLowStock
                                    ? "bg-white/95 text-amber-800 ring-1 ring-amber-500/30"
                                    : "bg-white/95 text-emerald-800 ring-1 ring-emerald-500/30",
                        ].join(" ")}
                    >
                        <span
                            className={[
                                "size-1.5 rounded-full shrink-0",
                                isOutOfStock
                                    ? "bg-rose-400"
                                    : isLowStock
                                        ? "bg-amber-500 animate-pulse"
                                        : "bg-emerald-500",
                            ].join(" ")}
                        />
                        {isOutOfStock
                            ? "Sold out"
                            : isLowStock
                                ? `${stock} left`
                                : `${stock} in stock`}
                    </span>
                </div>
            </div>

            {/* Product Meta & Price */}
            <div className="mt-3.5 flex flex-1 flex-col justify-between">
                <div>
                    <h3 className="line-clamp-1 text-[14.5px] font-bold tracking-tight text-stone-900 transition-colors group-hover:text-amber-900">
                        {name}
                    </h3>

                    <div className="mt-1 flex items-baseline justify-between">
                        <p className="tnum text-lg font-extrabold tracking-tight text-stone-900 sm:text-xl">
                            ${price.toFixed(2)}
                        </p>
                        <span className="text-[11px] font-medium text-stone-400">
                            per serving
                        </span>
                    </div>
                </div>

                {/* Quick Add Action */}
                <Button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={(e) => {
                        e.stopPropagation()
                        onAddToCart?.(id)
                    }}
                    className={[
                        "mt-3.5 h-9 w-full rounded-xl text-xs font-bold transition-all duration-150 active:scale-[0.98]",
                        isOutOfStock
                            ? "border border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed"
                            : "bg-stone-900 text-white shadow-sm hover:bg-amber-700 hover:shadow-md hover:shadow-amber-700/25",
                    ].join(" ")}
                >
                    {isOutOfStock ? (
                        "Unavailable"
                    ) : (
                        <span className="flex items-center justify-center gap-1.5">
                            <Plus className="size-3.5 stroke-[2.5]" />
                            Add to Order
                        </span>
                    )}
                </Button>
            </div>
        </article>
    )
}