import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react"
import { getMe, login as apiLogin, logout as apiLogout, setOnUnauthorized } from "../lib/api"
import type { User } from "../types/auth"

type AuthContextType = {
    user: User | null
    isLoading: boolean
    isAuthenticated: boolean
    isManager: boolean
    login: (email: string, password: string) => Promise<void>
    logout: () => Promise<void>
    error: string | null
    clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const POS_STORAGE_KEYS = [
    "pos_cart_id",
    "pos_cart_items",
    "pos_checkout_response",
    "pos_idempotency_key",
]

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const clearError = useCallback(() => setError(null), [])

    const handleSessionExpired = useCallback(() => {
        setUser(null)
    }, [])

    useEffect(() => {
        setOnUnauthorized(handleSessionExpired)
        return () => setOnUnauthorized(null)
    }, [handleSessionExpired])

    useEffect(() => {
        let isMounted = true

        async function verifySession() {
            try {
                const currentUser = await getMe()
                if (isMounted) {
                    setUser(currentUser)
                }
            } catch {
                if (isMounted) {
                    setUser(null)
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        verifySession()

        return () => {
            isMounted = false
        }
    }, [])

    const login = useCallback(async (email: string, password: string) => {
        setError(null)
        try {
            const response = await apiLogin(email, password)
            setUser(response.user)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Authentication failed"
            setError(message)
            throw err
        }
    }, [])

    const logout = useCallback(async () => {
        try {
            await apiLogout()
        } catch {
            // Silently continue to ensure client logout even if server was unreachable
        } finally {
            // Clear only client-side POS state (active server reservations continue standard expiry)
            try {
                POS_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key))
            } catch {
                // Ignore storage errors in private browsing
            }
            setUser(null)
        }
    }, [])

    const value = useMemo<AuthContextType>(
        () => ({
            user,
            isLoading,
            isAuthenticated: !!user,
            isManager: user?.role === "manager",
            login,
            logout,
            error,
            clearError,
        }),
        [user, isLoading, login, logout, error, clearError],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}
