import { useEffect, useMemo, useState } from "react"
import { Toast } from "../ui/Toast"
import {
    CheckCircle2,
    ChevronRight,
    ClipboardList,
    Clock3,
    DollarSign,
    Loader2,
    Package,
    RefreshCw,
    Search,
    User,
    XCircle,
} from "lucide-react"

import {
    cancelOrder,
    getOrders,
    type HandledBy,
    type Order,
} from "../../lib/api"

type OrderHistoryProps = {
    onInventoryRefresh?: () => void
}

function getStatusClasses(status: string) {
    switch (status) {
        case "Paid":
            return "bg-emerald-50 text-emerald-800 ring-emerald-300"
        case "Reserved":
            return "bg-amber-50 text-amber-900 ring-amber-300"
        case "Failed":
            return "bg-rose-50 text-rose-800 ring-rose-300"
        case "Expired":
            return "bg-stone-100 text-stone-600 ring-stone-200"
        case "Cancelled":
            return "bg-stone-100 text-stone-500 ring-stone-200"
        default:
            return "bg-stone-100 text-stone-600 ring-stone-200"
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
        (total, item) => total + Number(item.unit_price) * item.quantity,
        0,
    )
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(value)
}

/** Returns a short display label for the handler, or a legacy fallback. */
function formatHandledBy(handler: HandledBy | null | undefined): string {
    if (!handler) return "Unknown / Legacy Order"
    return handler.display_name
}

/** Returns handler display with role badge text, e.g. "Maya Patel · Manager" */
function formatHandledByWithRole(handler: HandledBy | null | undefined): string {
    if (!handler) return "Unknown / Legacy Order"
    const role = handler.role.charAt(0).toUpperCase() + handler.role.slice(1)
    return `${handler.display_name} · ${role}`
}

/** Format an ISO timestamp to a short time string, e.g. "2:47 PM" */
function formatTime(iso: string | null | undefined): string {
    if (!iso) return ""
    return new Date(iso).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    })
}

/** Format an ISO timestamp to a date+time string, e.g. "Sep 14, 2:47 PM" */
function formatDateTime(iso: string | null | undefined): string {
    if (!iso) return ""
    return new Date(iso).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function getOrderTimestamp(
    order: Order,
): { label: string; iso: string } {
    switch (order.status) {
        case "Paid":
            return { label: "Paid", iso: order.completed_at ?? order.created_at }
        case "Cancelled":
            return { label: "Cancelled", iso: order.completed_at ?? order.created_at }
        case "Expired":
            return { label: "Expired", iso: order.completed_at ?? order.created_at }
        case "Failed":
            return { label: "Failed", iso: order.completed_at ?? order.created_at }
        default:
            return { label: "Created", iso: order.created_at }
    }
}

export function OrderHistory({
    onInventoryRefresh,
}: OrderHistoryProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedOrderId, setSelectedOrderId] =
        useState<number | null>(null)

    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [searchQuery, setSearchQuery] = useState("")

    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [cancelling, setCancelling] = useState(false)
    const [cancelMessage, setCancelMessage] =
        useState<string | null>(null)
    const [confirmCancelId, setConfirmCancelId] =
        useState<number | null>(null)

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
                !response.some((order) => order.id === selectedOrderId)
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
        let ignore = false

        const fetchLatest = (isInitial = false) => {
            getOrders()
                .then((response) => {
                    if (!ignore) {
                        setOrders(response)
                        if (isInitial) {
                            setLoading(false)
                        }
                    }
                })
                .catch((requestError) => {
                    if (!ignore) {
                        if (isInitial) {
                            setError(
                                requestError instanceof Error
                                    ? requestError.message
                                    : "Unable to load orders.",
                            )
                            setLoading(false)
                        }
                    }
                })
        }

        fetchLatest(true)

        // Silent auto-refresh orders every 4 seconds and on focus so reservation expirations update live
        const intervalId = setInterval(() => fetchLatest(false), 4000)
        const onFocus = () => fetchLatest(false)
        window.addEventListener("focus", onFocus)

        return () => {
            ignore = true
            clearInterval(intervalId)
            window.removeEventListener("focus", onFocus)
        }
    }, [])

    const selectedOrder = useMemo(
        () => orders.find((order) => order.id === selectedOrderId) ?? null,
        [orders, selectedOrderId],
    )

    // Summary statistics
    const stats = useMemo(() => {
        const totalCount = orders.length
        const paidOrders = orders.filter((o) => o.status === "Paid")
        const paidCount = paidOrders.length
        const reservedCount = orders.filter((o) => o.status === "Reserved").length
        const totalRevenue = paidOrders.reduce((sum, o) => sum + getOrderTotal(o), 0)

        return {
            totalCount,
            paidCount,
            reservedCount,
            totalRevenue,
        }
    }, [orders])

    // Filtered orders list
    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            const matchesStatus =
                statusFilter === "all" ||
                order.status.toLowerCase() === statusFilter.toLowerCase()

            const query = searchQuery.trim().toLowerCase()
            const matchesQuery =
                !query ||
                String(order.id).includes(query) ||
                order.items.some((item) =>
                    item.product_name?.toLowerCase().includes(query),
                )

            return matchesStatus && matchesQuery
        })
    }, [orders, statusFilter, searchQuery])

    const handleCancel = async () => {
        if (
            selectedOrder === null ||
            cancelling ||
            !["Reserved", "Paid"].includes(selectedOrder.status)
        ) {
            return
        }

        // Require explicit confirmation before proceeding.
        if (confirmCancelId !== selectedOrder.id) {
            setConfirmCancelId(selectedOrder.id)
            return
        }

        try {
            setCancelling(true)
            setCancelMessage(null)
            setError(null)

            await cancelOrder(selectedOrder.id)

            setCancelMessage(
                `Order #${selectedOrder.id} cancelled successfully. Stock has been restored.`,
            )

            setConfirmCancelId(null)
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
            <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f8fafc]">
                <div className="flex items-center gap-2 text-sm font-semibold text-stone-500">
                    <Loader2 className="size-5 animate-spin text-amber-700" />
                    Loading orders ledger...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
            <div className="mx-auto max-w-7xl p-4 sm:p-6 space-y-6">
                {/* Page Title & Refresh */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <ClipboardList className="size-5 text-stone-800" />
                            <h1 className="text-xl font-bold tracking-tight text-stone-900">
                                Order History & Audit
                            </h1>
                        </div>

                        <p className="mt-0.5 text-xs text-stone-500 font-medium">
                            Real-time transaction register, stock holds, and payment logs.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => void loadOrders(true)}
                        disabled={refreshing}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-stone-200/90 bg-white px-3.5 text-xs font-bold text-stone-700 shadow-2xs hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95 transition-all"
                    >
                        <RefreshCw
                            className={`size-3.5 ${
                                refreshing ? "animate-spin text-amber-700" : ""
                            }`}
                        />
                        Refresh Ledger
                    </button>
                </div>

                {/* KPI Metrics Banner */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
                        <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                            Total Orders
                        </p>
                        <p className="tnum mt-1 text-2xl font-extrabold tracking-tight text-stone-900">
                            {stats.totalCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold tracking-wider text-emerald-800 uppercase">
                                Completed Paid
                            </p>
                            <CheckCircle2 className="size-4 text-emerald-600" />
                        </div>
                        <p className="tnum mt-1 text-2xl font-extrabold tracking-tight text-emerald-900">
                            {stats.paidCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold tracking-wider text-amber-800 uppercase">
                                Active Reserved
                            </p>
                            <Clock3 className="size-4 text-amber-600" />
                        </div>
                        <p className="tnum mt-1 text-2xl font-extrabold tracking-tight text-amber-900">
                            {stats.reservedCount}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                                Paid Volume
                            </p>
                            <DollarSign className="size-4 text-stone-600" />
                        </div>
                        <p className="tnum mt-1 text-2xl font-extrabold tracking-tight text-stone-950">
                            {formatCurrency(stats.totalRevenue)}
                        </p>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative min-w-0 flex-1 sm:max-w-xs">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Filter by Order # or item..."
                            aria-label="Filter orders"
                            className="h-9.5 w-full rounded-xl border border-stone-200/90 bg-white pl-9 pr-3 text-xs text-stone-900 outline-none placeholder:text-stone-400 focus:border-amber-600/60 focus:ring-2 focus:ring-amber-500/15 shadow-2xs"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                        {[
                            { id: "all", label: "All Orders" },
                            { id: "Reserved", label: "Reserved" },
                            { id: "Paid", label: "Paid" },
                            { id: "Expired", label: "Expired" },
                            { id: "Failed", label: "Failed" },
                            { id: "Cancelled", label: "Cancelled" },
                        ].map((tab) => {
                            const active = statusFilter.toLowerCase() === tab.id.toLowerCase()
                            const count =
                                tab.id === "all"
                                    ? orders.length
                                    : orders.filter(
                                          (o) => o.status.toLowerCase() === tab.id.toLowerCase(),
                                      ).length

                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setStatusFilter(tab.id)}
                                    className={[
                                        "inline-flex h-8.5 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all active:scale-95 shrink-0",
                                        active
                                            ? "bg-stone-900 text-white shadow-xs"
                                            : "border border-stone-200/90 bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900",
                                    ].join(" ")}
                                >
                                    <span>{tab.label}</span>
                                    <span
                                        className={[
                                            "rounded-full px-1.5 py-0.2 text-[10px]",
                                            active
                                                ? "bg-stone-750 text-stone-200"
                                                : "bg-stone-100 text-stone-600",
                                        ].join(" ")}
                                    >
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {cancelMessage && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-xs">
                        {cancelMessage}
                    </div>
                )}

                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800 shadow-xs">
                        {error}
                    </div>
                )}

                {/* Orders Content Split View */}
                {filteredOrders.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/70 p-8 text-center">
                        <Package className="size-8 text-stone-300" />
                        <p className="mt-3 text-sm font-bold text-stone-900">
                            No orders found
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                            No transactions matched the active filter or search query.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
                        {/* Orders List */}
                        <section className="space-y-3">
                            {filteredOrders.map((order) => {
                                const StatusIcon = getStatusIcon(order.status)
                                const total = getOrderTotal(order)
                                const selected = selectedOrderId === order.id
                                const ts = getOrderTimestamp(order)

                                return (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => setSelectedOrderId(order.id)}
                                        className={[
                                            "w-full rounded-2xl border bg-white p-4 text-left shadow-2xs transition-all duration-150 active:scale-[0.99]",
                                            selected
                                                ? "border-stone-900 ring-2 ring-stone-900 shadow-md"
                                                : "border-stone-200/90 hover:border-stone-300 hover:shadow-sm",
                                        ].join(" ")}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-700">
                                                <StatusIcon className="size-5" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm font-bold text-stone-900">
                                                        Order #{order.id}
                                                    </p>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${getStatusClasses(
                                                            order.status,
                                                        )}`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>

                                                <p className="tnum mt-1 text-xs text-stone-500 font-medium">
                                                    {order.items.length}{" "}
                                                    {order.items.length === 1 ? "item" : "items"}
                                                    {" · "}
                                                    <strong className="text-stone-900 font-bold">
                                                        {formatCurrency(total)}
                                                    </strong>
                                                    {" · "}
                                                    {ts.label} {formatTime(ts.iso)}
                                                </p>

                                                <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-400 font-medium">
                                                    <User className="size-3 shrink-0" />
                                                    <span>
                                                        Handled by{" "}
                                                        <span className={order.handled_by ? "font-semibold text-stone-600" : "italic"}>
                                                            {formatHandledBy(order.handled_by)}
                                                        </span>
                                                    </span>
                                                </p>
                                            </div>

                                            <ChevronRight className="size-4 shrink-0 text-stone-400" />
                                        </div>
                                    </button>
                                )
                            })}
                        </section>

                        {/* Order Detail Drawer */}
                        <aside className="h-fit rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs lg:sticky lg:top-20">
                            {selectedOrder === null ? (
                                <div className="py-16 text-center">
                                    <Package className="mx-auto size-8 text-stone-300" />
                                    <p className="mt-3 text-sm font-bold text-stone-900">
                                        Select an order
                                    </p>
                                    <p className="mt-1 text-xs text-stone-500">
                                        Choose any order card to inspect itemized receipts and manage status.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
                                        <div>
                                            <p className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                                                Order Receipt
                                            </p>

                                            <h2 className="mt-0.5 text-lg font-extrabold text-stone-950">
                                                #{selectedOrder.id}
                                            </h2>

                                            {/* Timestamp breakdown */}
                                            <div className="mt-1 space-y-0.5 text-[11px] text-stone-500 font-medium">
                                                <p>
                                                    Created:{" "}
                                                    <span className="font-semibold text-stone-800">
                                                        {formatDateTime(selectedOrder.created_at)}
                                                    </span>
                                                </p>

                                                {selectedOrder.completed_at && (
                                                    <p>
                                                        {selectedOrder.status === "Paid"
                                                            ? "Paid: "
                                                            : selectedOrder.status === "Cancelled"
                                                                ? "Cancelled: "
                                                                : selectedOrder.status === "Expired"
                                                                    ? "Expired: "
                                                                    : "Resolved: "}
                                                        <span className="font-semibold text-stone-800">
                                                            {formatDateTime(selectedOrder.completed_at)}
                                                        </span>
                                                    </p>
                                                )}

                                                <p className="flex items-center gap-1 pt-0.5">
                                                    <User className="size-3 shrink-0 text-stone-400" />
                                                    <span>
                                                        Handled by{" "}
                                                        <span
                                                            className={
                                                                selectedOrder.handled_by
                                                                    ? "font-semibold text-stone-700"
                                                                    : "italic text-stone-400"
                                                            }
                                                        >
                                                            {formatHandledByWithRole(selectedOrder.handled_by)}
                                                        </span>
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClasses(
                                                selectedOrder.status,
                                            )}`}
                                        >
                                            {selectedOrder.status}
                                        </span>
                                    </div>

                                    {/* Items breakdown */}
                                    <div className="mt-4">
                                        <p className="text-[11px] font-bold tracking-wider text-stone-400 uppercase">
                                            Itemized Products
                                        </p>

                                        <div className="mt-2.5 divide-y divide-stone-100">
                                            {selectedOrder.items.map((item) => (
                                                <div
                                                    key={`${selectedOrder.id}-${item.product_id}`}
                                                    className="flex items-center justify-between py-2 text-xs"
                                                >
                                                    <div>
                                                        <p className="font-bold text-stone-900">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="tnum text-[11px] text-stone-400">
                                                            {item.quantity} × {formatCurrency(Number(item.unit_price))}
                                                        </p>
                                                    </div>

                                                    <p className="tnum font-extrabold text-stone-900">
                                                        {formatCurrency(Number(item.unit_price) * item.quantity)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total */}
                                    <div className="mt-4 border-t border-stone-200/80 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-stone-500 uppercase">
                                                Total
                                            </span>
                                            <span className="tnum text-xl font-extrabold text-stone-950">
                                                {formatCurrency(getOrderTotal(selectedOrder))}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons for Cancellable Orders */}
                                    {["Reserved", "Paid"].includes(selectedOrder.status) && (
                                        <div className="mt-5 space-y-2 border-t border-stone-100 pt-4">
                                            {confirmCancelId === selectedOrder.id ? (
                                                <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3 text-center space-y-2.5">
                                                    <p className="text-xs font-bold text-rose-900">
                                                        Cancel this order and restore stock?
                                                    </p>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmCancelId(null)}
                                                            className="h-8.5 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 hover:bg-stone-50 active:scale-95 transition-all shadow-2xs"
                                                        >
                                                            Keep Order
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleCancel()}
                                                            disabled={cancelling}
                                                            className="inline-flex h-8.5 items-center justify-center gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 active:scale-95 transition-all shadow-xs"
                                                        >
                                                            {cancelling && (
                                                                <Loader2 className="size-3.5 animate-spin" />
                                                            )}
                                                            {cancelling ? "Releasing..." : "Yes, Cancel"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleCancel()}
                                                    disabled={cancelling}
                                                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50 active:scale-95 transition-all shadow-2xs"
                                                >
                                                    Cancel Order & Release Stock
                                                </button>
                                            )}
                                        </div>
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