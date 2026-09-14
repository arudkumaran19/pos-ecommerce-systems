import {
    Coffee,
    Loader2,
    Minus,
    Plus,
    Receipt,
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
    /** When true, disables the checkout button and shows a spinner. */
    isCheckingOut?: boolean
    /** When set, indicates an order has been created from this cart and is awaiting payment */
    reservedOrderId?: number | null
}

export function CartPanel({
    items,
    onIncrease,
    onDecrease,
    onRemove,
    onCheckout,
    onClose,
    isCheckingOut = false,
    reservedOrderId = null,
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
        <section className="flex h-full min-h-0 w-full flex-col bg-white border-l border-stone-200/80 select-none">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-stone-200/80 bg-stone-50/50 px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Receipt className="size-4.5 text-stone-800" />
                        <h2 className="text-sm font-bold tracking-tight text-stone-900">
                            Current Register Order
                        </h2>
                    </div>

                    <p className="mt-0.5 text-xs text-stone-500 font-medium">
                        {itemCount} {itemCount === 1 ? "item" : "items"} staged
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {items.length > 0 && (
                        <span
                            className={[
                                "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
                                reservedOrderId
                                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-500/30"
                                    : "bg-stone-100 text-stone-700",
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "size-1.5 rounded-full",
                                    reservedOrderId ? "bg-amber-500 animate-pulse" : "bg-stone-400",
                                ].join(" ")}
                            />
                            {reservedOrderId
                                ? `Order #${reservedOrderId} Reserved`
                                : "Draft"}
                        </span>
                    )}

                    {onClose && (
                        <button
                            type="button"
                            aria-label="Close cart"
                            onClick={onClose}
                            className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-200/70 hover:text-stone-900 active:scale-95"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Cart Body */}
            {items.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                    <div className="relative flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 shadow-xs">
                        <Coffee className="size-6" />
                        <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-stone-900 text-white">
                            <ShoppingCart className="size-2.5" />
                        </span>
                    </div>

                    <h3 className="mt-4 text-sm font-bold text-stone-900">
                        Your cart is empty
                    </h3>

                    <p className="mt-1 max-w-xs text-xs leading-relaxed text-stone-500">
                        Select beverages and pastries from the catalog to build a customer order.
                    </p>
                </div>
            ) : (
                <>
                    {/* Item list */}
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5 space-y-2.5">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="group relative rounded-xl border border-stone-200/80 bg-stone-50/40 p-3 transition-all duration-150 hover:bg-white hover:border-stone-300 hover:shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="truncate text-sm font-bold text-stone-900">
                                            {item.name}
                                        </h3>

                                        <p className="tnum mt-0.5 text-xs text-stone-500 font-medium">
                                            ${item.price.toFixed(2)} each
                                        </p>
                                    </div>

                                    {!reservedOrderId && (
                                        <button
                                            type="button"
                                            aria-label={`Remove ${item.name}`}
                                            onClick={() => onRemove?.(item.id)}
                                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600 active:scale-95"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="mt-3 flex items-center justify-between">
                                    {/* Stepper */}
                                    <div className="flex items-center rounded-lg border border-stone-200 bg-white shadow-xs">
                                        <button
                                            type="button"
                                            disabled={Boolean(reservedOrderId)}
                                            aria-label={`Decrease ${item.name} quantity`}
                                            onClick={() => onDecrease?.(item.id)}
                                            className="flex size-7.5 items-center justify-center text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 active:scale-90"
                                        >
                                            <Minus className="size-3 stroke-[2.5]" />
                                        </button>

                                        <span className="tnum flex min-w-7 justify-center text-xs font-bold text-stone-900">
                                            {item.quantity}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={Boolean(reservedOrderId)}
                                            aria-label={`Increase ${item.name} quantity`}
                                            onClick={() => onIncrease?.(item.id)}
                                            className="flex size-7.5 items-center justify-center text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-30 active:scale-90"
                                        >
                                            <Plus className="size-3 stroke-[2.5]" />
                                        </button>
                                    </div>

                                    {/* Line total */}
                                    <p className="tnum text-sm font-extrabold text-stone-900">
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Receipt Summary Footer */}
                    <div className="border-t border-stone-200/90 bg-stone-50/90 p-5 shadow-xs">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-medium text-stone-500">
                                <span>Subtotal</span>
                                <span className="tnum font-semibold text-stone-900">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-stone-200/70 pt-2">
                                <span className="text-sm font-bold text-stone-900">
                                    Total Amount
                                </span>
                                <span className="tnum text-xl font-extrabold tracking-tight text-stone-950">
                                    ${subtotal.toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Checkout CTA */}
                        {reservedOrderId ? (
                            <Button
                                type="button"
                                className="mt-4 h-11 w-full rounded-xl bg-amber-600 text-white font-bold shadow-xs hover:bg-amber-600 cursor-not-allowed"
                                disabled
                            >
                                Order #{reservedOrderId} · Awaiting Payment
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                className="mt-4 h-11 w-full rounded-xl bg-stone-900 text-white font-bold shadow-md shadow-stone-900/10 hover:bg-amber-700 hover:shadow-amber-700/25 transition-all duration-150 active:scale-[0.98]"
                                onClick={onCheckout}
                                disabled={isCheckingOut}
                            >
                                {isCheckingOut ? (
                                    <>
                                        <Loader2 className="mr-2 size-4 animate-spin" />
                                        Creating Reservation...
                                    </>
                                ) : (
                                    "Continue to Checkout"
                                )}
                            </Button>
                        )}

                        <p
                            className={[
                                "mt-2.5 text-center text-[11px] leading-4",
                                reservedOrderId
                                    ? "font-semibold text-amber-800"
                                    : "text-stone-400",
                            ].join(" ")}
                        >
                            {reservedOrderId
                                ? `Order #${reservedOrderId} is staged in the payment terminal.`
                                : "Stock is reserved for 5 minutes during checkout."}
                        </p>
                    </div>
                </>
            )}
        </section>
    )
}