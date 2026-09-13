import { Bell, CircleHelp, ShoppingCart } from "lucide-react"

type TopBarProps = {
    title: string
    cartItemCount?: number
}

export function TopBar({ title, cartItemCount = 0 }: TopBarProps) {
    return (
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
            <div>
                <h1 className="text-lg font-semibold tracking-tight text-zinc-950">
                    {title}
                </h1>
                <p className="text-xs text-zinc-500">
                    Manage products, orders, and checkout
                </p>
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    aria-label="Help"
                    className="flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                    <CircleHelp className="size-4" />
                </button>

                <button
                    type="button"
                    aria-label="Notifications"
                    className="flex size-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                >
                    <Bell className="size-4" />
                </button>

                <div className="mx-1 h-6 w-px bg-zinc-200" />

                <button
                    type="button"
                    className="relative flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                    <ShoppingCart className="size-4" />
                    <span>Cart</span>

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