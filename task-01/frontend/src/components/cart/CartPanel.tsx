import {
    Minus,
    Plus,
    ShoppingCart,
    Trash2,
    X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export type CartItem = {
    id: number
    name: string
    price: number
    quantity: number
}

type CartPanelProps = {
    items: CartItem[]
    onIncrease?: (productId: number) => void
    onDecrease?: (productId: number) => void
    onRemove?: (productId: number) => void
    onCheckout?: () => void
    onClose?: () => void
}

export function CartPanel({
                              items,
                              onIncrease,
                              onDecrease,
                              onRemove,
                              onCheckout,
                              onClose,
                          }: CartPanelProps) {
    const subtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0,
    )

    const itemCount = items.reduce(
        (total, item) => total + item.quantity,
        0,
    )

    return (
        <section className="flex h-full min-h-0 w-full flex-col bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4 text-zinc-700" />

                        <h2 className="text-sm font-semibold text-zinc-950">
                            Current order
                        </h2>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                        {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {items.length > 0 && (
                        <span className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] font-medium text-zinc-600">
                            Draft
                        </span>
                    )}

                    {onClose && (
                        <button
                            type="button"
                            aria-label="Close cart"
                            onClick={onClose}
                            className="flex size-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100">
                        <ShoppingCart className="size-5 text-zinc-400" />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-zinc-900">
                        Your cart is empty
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-5 text-zinc-500">
                        Select products from the catalog to start a new order.
                    </p>
                </div>
            ) : (
                <>
                    <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-zinc-200 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-medium text-zinc-900">
                                                {item.name}
                                            </h3>

                                            <p className="mt-1 text-xs text-zinc-500">
                                                ${item.price.toFixed(2)} each
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            aria-label={`Remove ${item.name}`}
                                            onClick={() =>
                                                onRemove?.(item.id)
                                            }
                                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center rounded-lg border border-zinc-200">
                                            <button
                                                type="button"
                                                aria-label={`Decrease ${item.name} quantity`}
                                                onClick={() =>
                                                    onDecrease?.(item.id)
                                                }
                                                className="flex size-8 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                                            >
                                                <Minus className="size-3.5" />
                                            </button>

                                            <span className="flex min-w-8 justify-center text-xs font-semibold text-zinc-900">
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                aria-label={`Increase ${item.name} quantity`}
                                                onClick={() =>
                                                    onIncrease?.(item.id)
                                                }
                                                className="flex size-8 items-center justify-center text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-950"
                                            >
                                                <Plus className="size-3.5" />
                                            </button>
                                        </div>

                                        <p className="text-sm font-semibold text-zinc-950">
                                            $
                                            {(
                                                item.price *
                                                item.quantity
                                            ).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-zinc-200 bg-zinc-50/80 p-5">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">
                                    Subtotal
                                </span>

                                <span className="font-medium text-zinc-900">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-base font-semibold">
                                <span className="text-zinc-950">
                                    Total
                                </span>

                                <span className="text-zinc-950">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            className="mt-4 h-11 w-full rounded-xl"
                            onClick={onCheckout}
                        >
                            Continue to checkout
                        </Button>

                        <p className="mt-2 text-center text-[11px] leading-4 text-zinc-500">
                            Stock is reserved during checkout.
                        </p>
                    </div>
                </>
            )}
        </section>
    )
}