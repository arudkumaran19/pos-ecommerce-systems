import { useState } from "react"
import { AppShell } from "./components/layout/AppShell"
import type { AppPage } from "./components/layout/Sidebar"
import { POSPage } from "./components/products/POSPage"
import { OrderHistory } from "./components/orders/OrderHistory"
import { InventoryView } from "./components/inventory/InventoryView"

const pageTitles: Record<AppPage, string> = {
    pos: "Point of Sale",
    orders: "Orders",
    inventory: "Inventory",
}

function App() {
    const [activePage, setActivePage] = useState<AppPage>("pos")

    const renderPage = () => {
        switch (activePage) {
            case "pos":
                return <POSPage />

            case "orders":
                return <OrderHistory />

            case "inventory":
                return <InventoryView />
        }
    }

    return (
        <AppShell
            title={pageTitles[activePage]}
            activePage={activePage}
            onNavigate={setActivePage}
        >
            {renderPage()}
        </AppShell>
    )
}

export default App