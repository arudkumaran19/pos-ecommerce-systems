import {
    ClipboardList,
    Coffee,
    Package,
    ShoppingCart,
    X,
} from "lucide-react"

export type AppPage = "pos" | "orders" | "inventory"

type SidebarProps = {
    activePage: AppPage
    onNavigate: (page: AppPage) => void
    onClose?: () => void
}

const navigation: {
    label: string
    subtitle: string
    page: AppPage
    icon: typeof ShoppingCart
}[] = [
    {
        label: "Point of Sale",
        subtitle: "Register & Orders",
        page: "pos",
        icon: ShoppingCart,
    },
    {
        label: "Orders",
        subtitle: "Audit & Payments",
        page: "orders",
        icon: ClipboardList,
    },
    {
        label: "Inventory",
        subtitle: "Stock & Catalog",
        page: "inventory",
        icon: Package,
    },
]

export function Sidebar({
    activePage,
    onNavigate,
    onClose,
}: SidebarProps) {
    return (
        <aside className="flex h-full w-64 shrink-0 flex-col border-r border-stone-800/80 bg-[#141210] text-stone-100 select-none">
            {/* Brand Header */}
            <div className="flex h-16 items-center justify-between border-b border-stone-800/70 px-5">
                <div className="flex items-center gap-3">
                    <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-md shadow-amber-500/25">
                        <Coffee className="size-4.5" />
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 ring-2 ring-[#141210]" />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-bold tracking-tight text-stone-100">
                                TechLoom
                            </p>
                            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold tracking-widest text-amber-300 uppercase">
                                POS
                            </span>
                        </div>

                        <p className="text-[11px] font-medium text-stone-400">
                            Artisan Coffee & Bar
                        </p>
                    </div>
                </div>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="flex size-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-stone-800 hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            {/* Navigation Section */}
            <div className="px-4 pt-5 pb-2">
                <p className="text-[10px] font-bold tracking-wider text-stone-400 uppercase">
                    Terminal Navigation
                </p>
            </div>

            <nav
                className="flex-1 space-y-1.5 px-3"
                aria-label="Primary navigation"
            >
                {navigation.map((item) => {
                    const Icon = item.icon
                    const active = activePage === item.page

                    return (
                        <button
                            key={item.page}
                            type="button"
                            onClick={() => onNavigate(item.page)}
                            className={[
                                "group relative flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150",
                                active
                                    ? "bg-gradient-to-r from-stone-800/90 to-stone-850/80 text-white shadow-sm ring-1 ring-stone-700/60 font-semibold"
                                    : "text-stone-300 hover:bg-stone-850/60 hover:text-stone-100",
                            ].join(" ")}
                        >
                            {/* Left Active Accent Pill */}
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-amber-400 shadow-sm shadow-amber-400/50" />
                            )}

                            <div
                                className={[
                                    "flex size-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-105",
                                    active
                                        ? "bg-amber-400/15 text-amber-400"
                                        : "bg-stone-850/80 text-stone-300 group-hover:text-stone-100",
                                ].join(" ")}
                            >
                                <Icon className="size-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm leading-tight font-medium">
                                    {item.label}
                                </p>
                                <p className="truncate text-[10px] text-stone-400">
                                    {item.subtitle}
                                </p>
                            </div>
                        </button>
                    )
                })}
            </nav>

            {/* Operational Status Footer */}
            <div className="border-t border-stone-850 p-3.5">
                <div className="rounded-xl border border-stone-800/60 bg-stone-900/60 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-semibold text-stone-200">
                            <span className="relative flex size-2">
                                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                            </span>
                            System Connected
                        </div>
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                            Live
                        </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                        <span>TechLoom POS</span>
                        <span className="text-stone-500">v1.0.0</span>
                    </div>
                </div>
            </div>
        </aside>
    )
}