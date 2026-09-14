import { useState } from "react"
import {
    Bell,
    CircleHelp,
    Menu,
    ShoppingCart,
} from "lucide-react"

type TopBarProps = {
    title: string
    cartItemCount?: number
    onMenuClick?: () => void
}

export function TopBar({
                           title,
                           cartItemCount = 0,
                           onMenuClick,
                       }: TopBarProps) {
    const [openPanel, setOpenPanel] = useState<
        "notifications" | "help" | null
    >(null)

    function togglePanel(
        panel: "notifications" | "help",
    ) {
        setOpenPanel((current) =>
            current === panel ? null : panel,
        )
    }

    return (
        <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
                {onMenuClick && (
                    <button
                        type="button"
                        onClick={onMenuClick}
                        aria-label="Open navigation"
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950 xl:hidden"
                    >
                        <Menu className="size-5" />
                    </button>
                )}

                <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-950">
                        {title}
                    </h1>

                    <p className="hidden text-xs text-zinc-500 sm:block">
                        Manage products, orders, and checkout
                    </p>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Help"
                        aria-expanded={openPanel === "help"}
                        onClick={() => togglePanel("help")}
                        className="flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                    >
                        <CircleHelp className="size-4" />
                    </button>

                    {openPanel === "help" && (
                        <div className="absolute right-0 top-11 z-[80] w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
                            <p className="text-sm font-semibold text-zinc-950">
                                POS Help
                            </p>

                            <div className="mt-3 space-y-2 text-xs leading-5 text-zinc-600">
                                <p>
                                    <strong className="text-zinc-900">
                                        Point of Sale:
                                    </strong>{" "}
                                    Add products to a cart and checkout.
                                </p>

                                <p>
                                    <strong className="text-zinc-900">
                                        Inventory:
                                    </strong>{" "}
                                    Create, edit, delete, and monitor stock.
                                </p>

                                <p>
                                    <strong className="text-zinc-900">
                                        Orders:
                                    </strong>{" "}
                                    Review order status and payment results.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        type="button"
                        aria-label="Notifications"
                        aria-expanded={
                            openPanel === "notifications"
                        }
                        onClick={() =>
                            togglePanel("notifications")
                        }
                        className="relative flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                    >
                        <Bell className="size-4" />

                        {cartItemCount > 0 && (
                            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-emerald-500" />
                        )}
                    </button>

                    {openPanel === "notifications" && (
                        <div className="absolute right-0 top-11 z-[80] w-72 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl">
                            <p className="text-sm font-semibold text-zinc-950">
                                Notifications
                            </p>

                            <div className="mt-3 rounded-lg bg-zinc-50 p-3">
                                <p className="text-xs font-medium text-zinc-800">
                                    Store operational
                                </p>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    Inventory, checkout, and payment
                                    services are available.
                                </p>
                            </div>

                            {cartItemCount > 0 && (
                                <div className="mt-2 rounded-lg bg-zinc-50 p-3">
                                    <p className="text-xs font-medium text-zinc-800">
                                        Current cart
                                    </p>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        {cartItemCount}{" "}
                                        {cartItemCount === 1
                                            ? "item"
                                            : "items"}{" "}
                                        waiting for checkout.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mx-1 h-6 w-px bg-zinc-200" />

                <button
                    type="button"
                    className="relative flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 sm:px-3"
                >
                    <ShoppingCart className="size-4" />

                    <span className="hidden sm:inline">
                        Cart
                    </span>

                    {cartItemCount > 0 && (
                        <span className="flex min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                            {cartItemCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    )
}