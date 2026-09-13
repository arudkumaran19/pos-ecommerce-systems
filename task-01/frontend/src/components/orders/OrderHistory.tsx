import { useEffect, useMemo, useState } from "react"
import { Toast } from "../ui/Toast"
import {
    CheckCircle2,
    ChevronRight,
    Clock3,
    Loader2,
    Package,
    RefreshCw,
    XCircle,
} from "lucide-react"

import {
    cancelOrder,
    getOrders,
    type Order,
} from "../../lib/api"

type OrderHistoryProps = {
    onInventoryRefresh?: () => void
}

function getStatusClasses(status: string) {
    switch (status) {
        case "Paid":
            return "bg-emerald-50 text-emerald-700 ring-emerald-200"

        case "Reserved":
            return "bg-amber-50 text-amber-700 ring-amber-200"

        case "Failed":
            return "bg-red-50 text-red-700 ring-red-200"

        case "Expired":
            return "bg-zinc-100 text-zinc-600 ring-zinc-200"

        case "Cancelled":
            return "bg-zinc-100 text-zinc-500 ring-zinc-200"

        default:
            return "bg-zinc-100 text-zinc-600 ring-zinc-200"
    }
}

function getStatusIcon(status: string) {
    switch (status) {
        case "Paid":
            return CheckCircle2

        case "Reserved":
            return Clock3

        case "Failed":
        case "Cancelled":
            return XCircle

        default:
            return Clock3
    }
}

function getOrderTotal(order: Order) {
    return order.items.reduce(
        (total, item) =>
            total + Number(item.unit_price) * item.quantity,
        0,
    )
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value)
}

export function OrderHistory({
                                 onInventoryRefresh,
                             }: OrderHistoryProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedOrderId, setSelectedOrderId] =
        useState<number | null>(null)

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const [cancelMessage, setCancelMessage] =
        useState<string | null>(null)

    const loadOrders = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true)
            } else {
                setLoading(true)
            }

            setError(null)

            const response = await getOrders()

            setOrders(response)

            if (
                selectedOrderId !== null &&
                !response.some(
                    (order) => order.id === selectedOrderId,
                )
            ) {
                setSelectedOrderId(null)
            }
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to load orders.",
            )
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        void loadOrders()
    }, [])

    const selectedOrder = useMemo(
        () =>
            orders.find(
                (order) => order.id === selectedOrderId,
            ) ?? null,
        [orders, selectedOrderId],
    )

    const handleCancel = async () => {
        if (
            selectedOrder === null ||
            cancelling ||
            !["Reserved", "Paid"].includes(
                selectedOrder.status,
            )
        ) {
            return
        }

        try {
            setCancelling(true)
            setCancelMessage(null)
            setError(null)

            await cancelOrder(selectedOrder.id)

            setCancelMessage(
                `Order #${selectedOrder.id} cancelled successfully.`,
            )

            await loadOrders(true)

            onInventoryRefresh?.()
        } catch (requestError) {
            setError(
                requestError instanceof Error
                    ? requestError.message
                    : "Unable to cancel order.",
            )
        } finally {
            setCancelling(false)
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-zinc-50">
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="size-4 animate-spin" />
                    Loading orders...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-zinc-50">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Package className="size-5 text-zinc-700" />

                            <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
                                Order history
                            </h1>
                        </div>

                        <p className="mt-1 text-sm text-zinc-500">
                            Review previous orders and manage active
                            reservations.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadOrders(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`size-4 ${
                                refreshing ? "animate-spin" : ""
                            }`}
                        />
                        Refresh
                    </button>
                </div>

                {cancelMessage && (
                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                        {cancelMessage}
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                        {error}
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="flex min-h-80 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
                        <div className="text-center">
                            <Package className="mx-auto size-8 text-zinc-300" />

                            <p className="mt-3 text-sm font-semibold text-zinc-900">
                                No orders yet
                            </p>

                            <p className="mt-1 text-sm text-zinc-500">
                                Completed orders will appear here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
                        <section className="space-y-3">
                            {orders.map((order) => {
                                const StatusIcon =
                                    getStatusIcon(order.status)

                                const total =
                                    getOrderTotal(order)

                                const selected =
                                    selectedOrderId === order.id

                                return (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() =>
                                            setSelectedOrderId(
                                                order.id,
                                            )
                                        }
                                        className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                                            selected
                                                ? "border-zinc-950 ring-1 ring-zinc-950"
                                                : "border-zinc-200 hover:border-zinc-300 hover:shadow"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100">
                                                <StatusIcon className="size-5 text-zinc-600" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-semibold text-zinc-950">
                                                        Order #
                                                        {order.id}
                                                    </p>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                                                            order.status,
                                                        )}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-zinc-500">
                                                    {order.items.length}{" "}
                                                    {order.items.length ===
                                                    1
                                                        ? "item"
                                                        : "items"}
                                                    {" · "}
                                                    {formatCurrency(
                                                        total,
                                                    )}
                                                </p>
                                            </div>

                                            <ChevronRight className="size-4 shrink-0 text-zinc-400" />
                                        </div>
                                    </button>
                                )
                            })}
                        </section>

                        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:sticky lg:top-6">
                            {selectedOrder === null ? (
                                <div className="py-12 text-center">
                                    <Package className="mx-auto size-8 text-zinc-300" />

                                    <p className="mt-3 text-sm font-semibold text-zinc-900">
                                        Select an order
                                    </p>

                                    <p className="mt-1 text-sm text-zinc-500">
                                        Choose an order to view its
                                        details.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                                                Order
                                            </p>

                                            <h2 className="mt-1 text-lg font-semibold text-zinc-950">
                                                #{selectedOrder.id}
                                            </h2>
                                        </div>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getStatusClasses(
                                                selectedOrder.status,
                                            )}`}
                                        >
                                            {
                                                selectedOrder.status
                                            }
                                        </span>
                                    </div>

                                    <div className="mt-5 border-t border-zinc-100 pt-5">
                                        <p className="text-sm font-semibold text-zinc-900">
                                            Items
                                        </p>

                                        <div className="mt-3 space-y-3">
                                            {selectedOrder.items.map(
                                                (item) => (
                                                    <div
                                                        key={`${selectedOrder.id}-${item.product_id}`}
                                                        className="flex items-center justify-between gap-4"
                                                    >
                                                        <div>
                                                            <p className="text-sm font-medium text-zinc-800">
                                                                Product #
                                                                {
                                                                    item.product_id
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-xs text-zinc-500">
                                                                {
                                                                    item.quantity
                                                                }{" "}
                                                                ×{" "}
                                                                {formatCurrency(
                                                                    Number(
                                                                        item.unit_price,
                                                                    ),
                                                                )}
                                                            </p>
                                                        </div>

                                                        <p className="text-sm font-semibold text-zinc-900">
                                                            {formatCurrency(
                                                                Number(
                                                                    item.unit_price,
                                                                ) *
                                                                item.quantity,
                                                            )}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-5 border-t border-zinc-100 pt-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-zinc-500">
                                                Total
                                            </span>

                                            <span className="text-lg font-semibold text-zinc-950">
                                                {formatCurrency(
                                                    getOrderTotal(
                                                        selectedOrder,
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {["Reserved", "Paid"].includes(
                                        selectedOrder.status,
                                    ) && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void handleCancel()
                                            }
                                            disabled={cancelling}
                                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {cancelling && (
                                                <Loader2 className="size-4 animate-spin" />
                                            )}
                                            {cancelling
                                                ? "Cancelling..."
                                                : "Cancel order"}
                                        </button>
                                    )}
                                </>
                            )}
                        </aside>
                    </div>
                )}
            </div>
            <Toast
                message={cancelMessage}
                variant="success"
                duration={5000}
                onClose={() => setCancelMessage(null)}
            />
        </div>
    )
}