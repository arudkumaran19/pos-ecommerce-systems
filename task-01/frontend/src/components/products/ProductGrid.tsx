import { SearchX } from "lucide-react"
import { ProductCard } from "./ProductCard"
import { resolveProductImage } from "../../lib/productImages"

export type Product = {
    id: number
    name: string
    price: number
    stock: number
}

type ProductGridProps = {
    products: Product[]
    onAddToCart?: (productId: number) => void
}

export function ProductGrid({
    products,
    onAddToCart,
}: ProductGridProps) {
    if (products.length === 0) {
        return (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center backdrop-blur-xs">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 shadow-xs">
                    <SearchX className="size-6" />
                </div>

                <h3 className="mt-4 text-base font-bold text-stone-900">
                    No beverages or items found
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
                    We couldn't find any menu items matching your filter or search query. Try clearing the search or switching filters.
                </p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    stock={product.stock}
                    image={resolveProductImage(product.id, product.name)}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    )
}
