import { useState } from "react"
import { Coffee } from "lucide-react"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { LoginPage } from "./components/auth/LoginPage"
import { AppShell } from "./components/layout/AppShell"
import type { AppPage } from "./components/layout/Sidebar"
import { POSPage } from "./components/products/POSPage"
import { OrderHistory } from "./components/orders/OrderHistory"
import { InventoryView } from "./components/inventory/InventoryView"
import { UserManagementView } from "./components/users/UserManagementView"

const pageTitles: Record<AppPage, string> = {
    pos: "Point of Sale",
    orders: "Orders",
    inventory: "Inventory",
    users: "Team & Operators",
}

function AuthenticatedPOS() {
    const { isAuthenticated, isLoading, isManager } = useAuth()
    const [activePage, setActivePage] = useState<AppPage>("pos")

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#141210] text-stone-200">
                <div className="flex flex-col items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-600/20 text-amber-500 animate-pulse">
                        <Coffee className="size-6" />
                    </div>
                    <p className="text-xs font-semibold tracking-wide text-stone-400">
                        Initializing POS Terminal Session...
                    </p>
                </div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <LoginPage />
    }

    // Safety fallback: Cashiers cannot access Inventory or User Management
    const safeActivePage: AppPage =
        (activePage === "inventory" || activePage === "users") && !isManager
            ? "pos"
            : activePage

    const renderPage = () => {
        switch (safeActivePage) {
            case "pos":
                return <POSPage />

            case "orders":
                return <OrderHistory />

            case "inventory":
                return isManager ? <InventoryView /> : <POSPage />

            case "users":
                return isManager ? <UserManagementView /> : <POSPage />
        }
    }

    return (
        <AppShell
            title={pageTitles[safeActivePage]}
            activePage={safeActivePage}
            onNavigate={setActivePage}
        >
            {renderPage()}
        </AppShell>
    )
}

function App() {
    return (
        <AuthProvider>
            <AuthenticatedPOS />
        </AuthProvider>
    )
}

export default App