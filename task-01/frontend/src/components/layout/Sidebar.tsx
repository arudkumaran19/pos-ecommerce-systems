import {
    ClipboardList,
    Package,
    ShoppingCart,
    Store,
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
    page: AppPage
    icon: typeof ShoppingCart
}[] = [
    {
        label: "Point of Sale",
        page: "pos",
        icon: ShoppingCart,
    },
    {
        label: "Orders",
        page: "orders",
        icon: ClipboardList,
    },
    {
        label: "Inventory",
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
        <aside className="flex h-full w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100">
            <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white text-zinc-950">
                        <Store className="size-5" />
                    </div>

                    <div>
                        <p className="text-sm font-semibold tracking-tight">
                            Techloom POS
                        </p>

                        <p className="text-xs text-zinc-500">
                            Store Operations
                        </p>
                    </div>
                </div>

                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-900 hover:text-white"
                    >
                        <X className="size-4" />
                    </button>
                )}
            </div>

            <nav
                className="flex-1 space-y-1 p-3"
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
                                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                                active
                                    ? "bg-white text-zinc-950"
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                            ].join(" ")}
                        >
                            <Icon className="size-4" />
                            {item.label}
                        </button>
                    )
                })}
            </nav>

            <div className="border-t border-zinc-800 p-4">
                <div className="rounded-xl bg-zinc-900 p-3">
                    <p className="text-xs font-medium text-zinc-300">
                        Store status
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" />

                        <span className="text-xs text-zinc-500">
                            Operational
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    )
}