import { useEffect, useMemo, useState } from "react"
import { Loader2, PackageSearch } from "lucide-react"
import { Toast } from "../ui/Toast"

import {
    addCartItem,
    checkoutCart,
    createCart,
    getProducts,
    processPayment,
    removeCartItem,
    updateCartItemQuantity,
    type Product as ApiProduct,
} from "../../lib/api"

import { ProductGrid, type Product } from "./ProductGrid"
import {
    ProductToolbar,
    type StockFilter,
} from "./ProductToolbar"
import {
    CartPanel,
    type CartItem,
} from "../cart/CartPanel"

function mapProduct(product: ApiProduct): Product {
    return {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        stock: product.available_stock,
    }
}

export function POSPage() {
    const [search, setSearch] = useState("")
    const [stockFilter, setStockFilter] =
        useState<StockFilter>("all")
    const [products, setProducts] = useState<Product[]>([])
    const [cartItems, setCartItems] = useState<CartItem[]>([])
    const [cartId, setCartId] = useState<number | null>(null)
    const [mobileCartOpen, setMobileCartOpen] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)


    const [checkoutMessage, setCheckoutMessage] =
        useState<string | null>(null)

    const [checkoutError, setCheckoutError] =
        useState<string | null>(null)

    const [checkoutResponse, setCheckoutResponse] =
        useState<Awaited<ReturnType<typeof checkoutCart>> | null>(null)

    const [paymentLoading, setPaymentLoading] = useState(false)

    const [paymentMessage, setPaymentMessage] =
        useState<string | null>(null)

    const [paymentError, setPaymentError] =
        useState<string | null>(null)



    useEffect(() => {
        let cancelled = false

        async function loadProducts() {
            try {
                setLoading(true)
                setError(null)

                const response = await getProducts()


                if (!cancelled) {
                    setProducts(
                        response
                            .filter((product) => product.is_active)
                            .map(mapProduct),
                    )
                }

            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Unable to load products.",
                    )
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void loadProducts()

        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        let cancelled = false

        async function initializeCart() {
            try {
                const cart = await createCart()

                if (!cancelled) {
                    setCartId(cart.id)
                }
            } catch (requestError) {
                if (!cancelled) {
                    setError(
                        requestError instanceof Error
                            ? requestError.message
                            : "Unable to create cart.",
                    )
                }
            }
        }

        void initializeCart()

        return () => {
            cancelled = true
        }
    }, [])

    const filteredProducts = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase()

        return products.filter((product) => {
            const matchesSearch =
                !normalizedSearch ||
                product.name.toLowerCase().includes(normalizedSearch)

            const matchesStock =
                stockFilter === "all"
                    ? true
                    : stockFilter === "in-stock"
                        ? product.stock > 5
                        : stockFilter === "low-stock"
                            ? product.stock > 0 && product.stock <= 5
                            : product.stock === 0

            return matchesSearch && matchesStock
        })
    }, [products, search, stockFilter])

    const addToCart = async (productId: number) => {
        const product = products.find((item) => item.id === productId)

        if (!product || product.stock <= 0) {
            return
        }

        if (cartId === null) {
            return
        }

        try {
            await addCartItem(cartId, productId, 1)
        } catch (requestError) {
            console.error(requestError)
            return
        }

        setCartItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.id === productId,
            )

            if (existingItem) {
                return currentItems.map((item) =>
                    item.id === productId
                        ? { ...item, quantity: item.quantity + 1 }
                        : item,
                )
            }

            return [
                ...currentItems,
                {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                },
            ]
        })

        if (window.matchMedia("(max-width: 1279px)").matches) {
            setMobileCartOpen(true)
        }
    }

    const increaseQuantity = async (productId: number) => {
        const item = cartItems.find(
            (cartItem) => cartItem.id === productId,
        )

        if (!item) {
            return
        }

        if (cartId === null) {
            return
        }

        try {
            const updatedCart = await updateCartItemQuantity(
                cartId,
                productId,
                item.quantity + 1,
            )

            setCartItems((currentItems) =>
                currentItems.map((currentItem) => {
                    const backendItem = updatedCart.items.find(
                        (cartItem) => cartItem.product_id === currentItem.id,
                    )

                    return backendItem
                        ? {
                            ...currentItem,
                            quantity: backendItem.quantity,
                        }
                        : currentItem
                }),
            )
        } catch (requestError) {
            console.error(requestError)
        }
    }

    const decreaseQuantity = async (productId: number) => {
        const item = cartItems.find(
            (cartItem) => cartItem.id === productId,
        )

        if (!item || cartId === null) {
            return
        }

        try {
            if (item.quantity === 1) {
                await removeCartItem(cartId, productId)

                setCartItems((currentItems) =>
                    currentItems.filter(
                        (currentItem) => currentItem.id !== productId,
                    ),
                )

                return
            }

            const updatedCart = await updateCartItemQuantity(
                cartId,
                productId,
                item.quantity - 1,
            )

            setCartItems((currentItems) =>
                currentItems.map((currentItem) => {
                    const backendItem = updatedCart.items.find(
                        (cartItem) => cartItem.product_id === currentItem.id,
                    )

                    return backendItem
                        ? {
                            ...currentItem,
                            quantity: backendItem.quantity,
                        }
                        : currentItem
                }),
            )
        } catch (requestError) {
            console.error(requestError)
        }
    }

    const removeFromCart = async (productId: number) => {
        if (cartId === null) {
            return
        }

        try {
            await removeCartItem(cartId, productId)

            setCartItems((currentItems) =>
                currentItems.filter((item) => item.id !== productId),
            )
        } catch (requestError) {
            console.error(requestError)
        }
    }

    const handleCheckout = async () => {
        if (cartId === null || cartItems.length === 0) {
            return
        }

        try {
            setCheckoutMessage(null)
            setCheckoutError(null)
            setPaymentMessage(null)
            setPaymentError(null)

            const response = await checkoutCart(cartId)

            setCheckoutResponse(response)

            setCheckoutMessage(
                `Order #${response.order.id} created. Stock is reserved until ${new Date(
                    response.reservation_expires_at,
                ).toLocaleTimeString()}.`,
            )

        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "Checkout failed."

            setCheckoutMessage(null)
            setCheckoutError(message)
            setCheckoutResponse(null)

            console.error(requestError)
        }
    }
    const handlePayment = async (
        outcome: "success" | "failure" | "timeout",
    ) => {
        if (!checkoutResponse || paymentLoading) {
            return
        }

        try {
            setPaymentLoading(true)
            setPaymentMessage(null)
            setPaymentError(null)

            const response = await processPayment(
                checkoutResponse.order.id,
                {
                    idempotency_key: `pos-${checkoutResponse.order.id}-${Date.now()}`,
                    outcome,
                },
            )

            const orderStatus =
                outcome === "success"
                    ? "Paid"
                    : outcome === "failure"
                        ? "Failed"
                        : "Expired"

            setCheckoutResponse((current) =>
                current
                    ? {
                        ...current,
                        order: {
                            ...current.order,
                            status: orderStatus,
                        },
                    }
                    : current,
            )

            setPaymentMessage(
                `Payment ${response.status.toLowerCase()}. Order #${response.order_id} is now ${orderStatus}.`,
            )

            // Refresh inventory so product cards show current stock.
            const refreshedProducts = await getProducts()

            setProducts(
                refreshedProducts
                    .filter((product) => product.is_active)
                    .map(mapProduct),
            )

            // Start a fresh cart for the next order.
            const newCart = await createCart()

            setCartId(newCart.id)
            setCartItems([])
        } catch (requestError) {
            const message =
                requestError instanceof Error
                    ? requestError.message
                    : "Payment failed."

            setPaymentError(message)

            console.error(requestError)
        } finally {
            setPaymentLoading(false)
        }
    }

    const cartItemCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0,
    )


    return (
        <div className="flex h-[calc(100vh-4rem)] min-h-0">
            <section className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-6">
                        <div className="mb-1 flex items-start gap-2">
                            <PackageSearch className="size-5 text-zinc-700" />

                            <h2 className="text-lg font-semibold tracking-tight text-zinc-950 sm:text-xl">
                                Product catalog
                            </h2>
                        </div>

                        <p className="text-sm text-zinc-500">
                            Select products to build the current order.
                        </p>
                    </div>

                    <ProductToolbar
                        search={search}
                        onSearchChange={setSearch}
                        stockFilter={stockFilter}
                        onStockFilterChange={setStockFilter}
                    />


                    {checkoutError && (
                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            Checkout failed: {checkoutError}
                        </div>
                    )}

                    {checkoutResponse && (
                        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-zinc-950">
                                        Order #{checkoutResponse.order.id}
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        Order status: {checkoutResponse.order.status}
                                    </p>
                                </div>

                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                {checkoutResponse.order.status}
            </span>
                            </div>

                            <div className="mt-4 border-t border-zinc-100 pt-4">
                                <p className="text-sm font-semibold text-zinc-900">
                                    Payment
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                    Simulated payment gateway
                                </p>
                                {checkoutResponse.order.status === "Reserved" && (
                                    <div className="mt-3 grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            disabled={paymentLoading}
                                            onClick={() => void handlePayment("success")}
                                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Pay successfully
                                        </button>

                                        <button
                                            type="button"
                                            disabled={paymentLoading}
                                            onClick={() => void handlePayment("failure")}
                                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Decline payment
                                        </button>

                                        <button
                                            type="button"
                                            disabled={paymentLoading}
                                            onClick={() => void handlePayment("timeout")}
                                            className="rounded-lg bg-zinc-700 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Simulate timeout
                                        </button>
                                    </div>
                                )}

                                {paymentLoading && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                                        <Loader2 className="size-3.5 animate-spin" />
                                        Processing payment...
                                    </div>
                                )}

                            </div>
                        </div>
                    )}

                    <div className="mt-5">
                        {loading ? (
                            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Loader2 className="size-4 animate-spin" />
                                    Loading products...
                                </div>
                            </div>
                        ) : error ? (
                            <div className="flex min-h-80 items-center justify-center rounded-2xl border border-red-200 bg-red-50">
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-red-900">
                                        Unable to load products
                                    </p>

                                    <p className="mt-1 text-sm text-red-700">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <ProductGrid
                                products={filteredProducts}
                                onAddToCart={addToCart}
                            />
                        )}
                    </div>
                </div>
            </section>

            {/* Desktop cart */}
            <aside className="hidden w-[360px] shrink-0 xl:block">
                <CartPanel
                    items={cartItems}
                    onIncrease={increaseQuantity}
                    onDecrease={decreaseQuantity}
                    onRemove={removeFromCart}
                    onCheckout={handleCheckout}
                />
            </aside>

            {/* Mobile cart button */}
            <div className="fixed bottom-4 right-4 z-40 xl:hidden">
                <button
                    type="button"
                    onClick={() => setMobileCartOpen(true)}
                    className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white shadow-lg"
                >
                    Cart ({cartItemCount})
                </button>
            </div>

            {/* Mobile cart drawer */}
            {mobileCartOpen && (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <button
                        type="button"
                        aria-label="Close cart"
                        onClick={() => setMobileCartOpen(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl">
                        <CartPanel
                            items={cartItems}
                            onIncrease={increaseQuantity}
                            onDecrease={decreaseQuantity}
                            onRemove={removeFromCart}
                            onCheckout={() => {
                                setMobileCartOpen(false)
                                void handleCheckout()
                            }}
                            onClose={() => setMobileCartOpen(false)}
                        />
                    </div>
                </div>
            )}
            <Toast
                message={checkoutMessage ?? paymentMessage}
                variant="success"
                duration={8000}
                onClose={() => {
                    setCheckoutMessage(null)
                    setPaymentMessage(null)
                }}
            />

            {paymentError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                    {paymentError}
                </div>
            )}
        </div>
    )
}