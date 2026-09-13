import { Sidebar, type AppPage } from "./Sidebar"
import { TopBar } from "./TopBar"

type AppShellProps = {
    children: React.ReactNode
    title: string
    activePage: AppPage
    onNavigate: (page: AppPage) => void
    cartItemCount?: number
}

export function AppShell({
                             children,
                             title,
                             activePage,
                             onNavigate,
                             cartItemCount = 0,
                         }: AppShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-zinc-100">
            <Sidebar
                activePage={activePage}
                onNavigate={onNavigate}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar
                    title={title}
                    cartItemCount={cartItemCount}
                />

                <main className="min-h-0 flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}