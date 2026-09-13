import { PackagePlus } from "lucide-react"
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
        <article className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-zinc-100">
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <PackagePlus className="size-12 text-zinc-300 transition-transform duration-200 group-hover:scale-105" />
                )}
            </div>

            <div className="mt-4 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-zinc-950">
                            {name}
                        </h3>

                        <p className="mt-1 text-lg font-bold tracking-tight text-zinc-950">
                            ${price.toFixed(2)}
                        </p>
                    </div>

                    <span
                        className={[
                            "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
                            isOutOfStock
                                ? "bg-red-50 text-red-600"
                                : isLowStock
                                    ? "bg-amber-50 text-amber-700"
                                    : "bg-emerald-50 text-emerald-700",
                        ].join(" ")}
                    >
            {isOutOfStock
                ? "Out of stock"
                : isLowStock
                    ? `${stock} left`
                    : `${stock} in stock`}
          </span>
                </div>
            </div>

            <Button
                type="button"
                className="mt-4 w-full rounded-xl"
                disabled={isOutOfStock}
                onClick={() => onAddToCart?.(id)}
            >
                {isOutOfStock ? "Unavailable" : "Add to cart"}
            </Button>
        </article>
    )
}