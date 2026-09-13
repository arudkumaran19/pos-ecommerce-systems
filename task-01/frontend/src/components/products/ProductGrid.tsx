import { ProductCard } from "./ProductCard"
import { productImages } from "../../lib/productImages"

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
            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-white">
                <div className="text-center">
                    <p className="text-sm font-semibold text-zinc-900">
                        No products found
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                        Try changing your search or filters.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    stock={product.stock}
                    image={productImages[product.id]}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    )
}
