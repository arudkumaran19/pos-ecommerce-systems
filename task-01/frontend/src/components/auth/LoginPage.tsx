import { useState } from "react"
import {
    AlertCircle,
    CheckCircle2,
    Coffee,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Mail,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export function LoginPage() {
    const { login, error, clearError } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [localError, setLocalError] = useState<string | null>(null)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim() || !password) {
            setLocalError("Please enter both email and password")
            return
        }

        setLocalError(null)
        clearError()
        setIsSubmitting(true)

        try {
            await login(email.trim(), password)
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Invalid email or password"
            setLocalError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    const activeError = localError || error

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#100e0c] px-4 py-12 select-none">
            {/* Background ambient glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-amber-600/10 blur-3xl" />
                <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 size-96 rounded-full bg-amber-700/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Brand Card */}
                <div className="rounded-3xl border border-stone-800/80 bg-[#161412]/90 p-8 shadow-2xl backdrop-blur-2xl">
                    {/* Header */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center">
                            <div className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg shadow-amber-600/30">
                                <Coffee className="size-7" />
                                <span className="absolute -top-1 -right-1 size-3 rounded-full bg-emerald-400 ring-4 ring-[#161412]" />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-stone-100">
                                TechLoom
                            </h1>
                            <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-amber-300 uppercase">
                                POS
                            </span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-stone-400">
                            Artisan Coffee & Retail Terminal · Secure Operator Login
                        </p>
                    </div>

                    {/* Error Banner */}
                    {activeError && (
                        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-900/50 bg-rose-950/40 p-3.5 text-xs text-rose-300 animate-in fade-in slide-in-from-top-2 duration-150">
                            <AlertCircle className="size-4.5 shrink-0 text-rose-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-semibold text-rose-200">Sign-in Failed</p>
                                <p className="mt-0.5 text-rose-300/90 leading-relaxed">{activeError}</p>
                            </div>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                                Operator Email
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
                                    <Mail className="size-4" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value)
                                        if (activeError) setLocalError(null)
                                    }}
                                    placeholder="operator@techloom.com"
                                    className="w-full rounded-xl border border-stone-800 bg-stone-900/80 py-2.5 pl-10 pr-4 text-sm text-stone-100 placeholder-stone-600 transition-colors focus:border-amber-500 focus:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                                Terminal Passcode / Password
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-stone-500">
                                    <Lock className="size-4" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value)
                                        if (activeError) setLocalError(null)
                                    }}
                                    placeholder="••••••••••••"
                                    className="w-full rounded-xl border border-stone-800 bg-stone-900/80 py-2.5 pl-10 pr-10 text-sm text-stone-100 placeholder-stone-600 transition-colors focus:border-amber-500 focus:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-500 hover:text-stone-300"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="size-4" />
                                    ) : (
                                        <Eye className="size-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-600/25 transition-all hover:from-amber-500 hover:to-amber-600 hover:shadow-amber-500/35 active:scale-[0.99] disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    <span>Verifying Session...</span>
                                </>
                            ) : (
                                <>
                                    <KeyRound className="size-4" />
                                    <span>Sign in to Register</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Security Footer Note */}
                    <div className="mt-8 border-t border-stone-800/80 pt-6 flex items-center justify-center gap-1.5 text-[10px] text-stone-500">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        <span>HttpOnly Session · Server-Enforced RBAC · DB Revocation</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
