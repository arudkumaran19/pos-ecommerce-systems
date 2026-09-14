import { useState } from "react"
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
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

    function handleNavigate(page: AppPage) {
        onNavigate(page)
        setMobileSidebarOpen(false)
    }

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-100">
            {/* Desktop sidebar */}
            <div className="hidden xl:block">
                <Sidebar
                    activePage={activePage}
                    onNavigate={handleNavigate}
                />
            </div>

            {/* Mobile sidebar */}
            {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 xl:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setMobileSidebarOpen(false)}
                        className="absolute inset-0 bg-black/40"
                    />

                    <div className="relative h-full w-72 max-w-[85vw] shadow-2xl">
                        <Sidebar
                            activePage={activePage}
                            onNavigate={handleNavigate}
                            onClose={() => setMobileSidebarOpen(false)}
                        />
                    </div>
                </div>
            )}

            <div className="flex min-w-0 flex-1 flex-col">
                <TopBar
                    title={title}
                    cartItemCount={cartItemCount}
                    onMenuClick={() => setMobileSidebarOpen(true)}
                />

                <main className="min-h-0 flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}