import { useState } from "react"
import {
    Bell,
    ChevronDown,
    CircleHelp,
    Coffee,
    LogOut,
    Menu,
    Shield,
    ShieldCheck,
    ShoppingCart,
    Sparkles,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

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
    const { user, logout } = useAuth()
    const [openPanel, setOpenPanel] = useState<
        "notifications" | "help" | "profile" | null
    >(null)

    function togglePanel(panel: "notifications" | "help" | "profile") {
        setOpenPanel((current) => (current === panel ? null : panel))
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-md sm:px-6 select-none">
            <div className="flex min-w-0 items-center gap-3">
                {onMenuClick && (
                    <button
                        type="button"
                        onClick={onMenuClick}
                        aria-label="Open navigation"
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-stone-200/80 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-950 active:scale-95 xl:hidden"
                    >
                        <Menu className="size-5" />
                    </button>
                )}

                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-amber-700/90 tracking-wide uppercase">
                            TechLoom Café
                        </span>
                        <span className="text-stone-300">•</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-500">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Live Terminal
                        </span>
                    </div>

                    <h1 className="truncate text-base font-bold tracking-tight text-stone-900 sm:text-lg">
                        {title}
                    </h1>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {/* Help Menu */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Help"
                        aria-expanded={openPanel === "help"}
                        onClick={() => togglePanel("help")}
                        className={[
                            "flex size-9 items-center justify-center rounded-xl border transition-all duration-150 active:scale-95",
                            openPanel === "help"
                                ? "border-stone-300 bg-stone-100 text-stone-900 shadow-inner"
                                : "border-transparent text-stone-500 hover:border-stone-200 hover:bg-stone-100/80 hover:text-stone-900",
                        ].join(" ")}
                    >
                        <CircleHelp className="size-4.5" />
                    </button>

                    {openPanel === "help" && (
                        <div className="absolute right-0 top-11 z-[80] w-80 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                                    <Coffee className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-stone-900">
                                        Terminal Guide
                                    </p>
                                    <p className="text-[11px] text-stone-400">
                                        Quick operator shortcuts & workflows
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3 space-y-2.5 text-xs leading-5 text-stone-600">
                                <div className="rounded-xl bg-stone-50/80 p-2.5">
                                    <strong className="font-semibold text-stone-900">
                                        1. Point of Sale:
                                    </strong>{" "}
                                    Click items to add to cart. Continue to checkout reserves stock with a 5-minute expiry timer.
                                </div>

                                <div className="rounded-xl bg-stone-50/80 p-2.5">
                                    <strong className="font-semibold text-stone-900">
                                        2. Payment Gateway:
                                    </strong>{" "}
                                    Test realistic gateway outcomes (Success, Decline, Timeout) or cancel reservations anytime to release stock.
                                </div>

                                <div className="rounded-xl bg-stone-50/80 p-2.5">
                                    <strong className="font-semibold text-stone-900">
                                        3. Real-Time Sync:
                                    </strong>{" "}
                                    Inventory and orders sync live every 4s across all open registers.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications Menu */}
                <div className="relative">
                    <button
                        type="button"
                        aria-label="Notifications"
                        aria-expanded={openPanel === "notifications"}
                        onClick={() => togglePanel("notifications")}
                        className={[
                            "relative flex size-9 items-center justify-center rounded-xl border transition-all duration-150 active:scale-95",
                            openPanel === "notifications"
                                ? "border-stone-300 bg-stone-100 text-stone-900 shadow-inner"
                                : "border-transparent text-stone-500 hover:border-stone-200 hover:bg-stone-100/80 hover:text-stone-900",
                        ].join(" ")}
                    >
                        <Bell className="size-4.5" />

                        {cartItemCount > 0 && (
                            <span className="absolute right-2 top-2 size-2 rounded-full bg-amber-500 ring-2 ring-white" />
                        )}
                    </button>

                    {openPanel === "notifications" && (
                        <div className="absolute right-0 top-11 z-[80] w-80 rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                <p className="text-sm font-bold text-stone-900">
                                    System Status
                                </p>
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                    <ShieldCheck className="size-3" />
                                    Healthy
                                </span>
                            </div>

                            <div className="mt-3 space-y-2">
                                <div className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-2.5">
                                    <span className="mt-0.5 flex size-2 rounded-full bg-emerald-500 shrink-0" />
                                    <div>
                                        <p className="text-xs font-semibold text-emerald-900">
                                            Inventory & POS Online
                                        </p>
                                        <p className="mt-0.5 text-[11px] leading-4 text-emerald-700">
                                            Checkout, stock reservation, and idempotency services operational.
                                        </p>
                                    </div>
                                </div>

                                {cartItemCount > 0 ? (
                                    <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 bg-amber-50/60 p-2.5">
                                        <Sparkles className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-amber-900">
                                                Active Register Order
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-amber-700">
                                                {cartItemCount} {cartItemCount === 1 ? "item" : "items"} currently staged in cart.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="py-2 text-center text-[11px] text-stone-400">
                                        No pending alerts
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mx-1 h-5 w-px bg-stone-200" />

                {/* Cart indicator badge */}
                <div className="flex items-center gap-2 rounded-xl border border-stone-200/90 bg-stone-50/80 px-3 py-1.5 shadow-sm">
                    <ShoppingCart className="size-4 text-stone-700" />
                    <span className="text-xs font-semibold text-stone-800">
                        Cart
                    </span>
                    <span
                        className={[
                            "flex min-w-5 h-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold transition-all",
                            cartItemCount > 0
                                ? "bg-amber-600 text-white shadow-xs shadow-amber-600/30"
                                : "bg-stone-200 text-stone-600",
                        ].join(" ")}
                    >
                        {cartItemCount}
                    </span>
                </div>

                {/* Operator Profile Capsule */}
                {user && (
                    <div className="relative">
                        <button
                            type="button"
                            aria-label="Operator Profile"
                            aria-expanded={openPanel === "profile"}
                            onClick={() => togglePanel("profile")}
                            className={[
                                "flex items-center gap-2 rounded-xl border border-stone-200/90 bg-stone-50/80 px-2.5 py-1.5 shadow-sm transition-all duration-150 hover:border-stone-300 hover:bg-stone-100/90 active:scale-95",
                                openPanel === "profile" ? "border-stone-400 bg-stone-100 ring-2 ring-amber-500/20" : "",
                            ].join(" ")}
                        >
                            <div className={[
                                "flex size-6 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-xs",
                                user.role === "manager"
                                    ? "bg-gradient-to-br from-amber-500 to-amber-700"
                                    : "bg-gradient-to-br from-emerald-500 to-teal-700",
                            ].join(" ")}>
                                {user.display_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="hidden text-left sm:block">
                                <p className="truncate text-xs font-semibold leading-tight text-stone-800">
                                    {user.display_name}
                                </p>
                                <p className="text-[10px] font-medium text-stone-400 capitalize">
                                    {user.role}
                                </p>
                            </div>
                            <ChevronDown className="size-3 text-stone-400" />
                        </button>

                        {openPanel === "profile" && (
                            <div className="absolute right-0 top-11 z-[80] w-64 rounded-2xl border border-stone-200/90 bg-white p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
                                <div className="border-b border-stone-100 pb-2.5 px-1">
                                    <p className="text-xs font-bold text-stone-900 truncate">
                                        {user.display_name}
                                    </p>
                                    <p className="text-[11px] text-stone-400 truncate">
                                        {user.email}
                                    </p>
                                    <div
                                        className="mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize border"
                                        style={{
                                            backgroundColor: user.role === "manager" ? "#fffbeb" : "#ecfdf5",
                                            color: user.role === "manager" ? "#b45309" : "#047857",
                                            borderColor: user.role === "manager" ? "#fde68a" : "#a7f3d0",
                                        }}
                                    >
                                        <Shield className="size-3" />
                                        {user.role} Privilege
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenPanel(null)
                                            logout()
                                        }}
                                        className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 active:scale-[0.98]"
                                    >
                                        <LogOut className="size-3.5" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    )
}