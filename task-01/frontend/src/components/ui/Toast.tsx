import { useEffect, useRef, useState } from "react"
import {
    CheckCircle2,
    Info,
    X,
    XCircle,
} from "lucide-react"

export type ToastVariant = "success" | "error" | "info"

export type ToastItemData = {
    id: string
    message: string
    variant?: ToastVariant
    duration?: number
}

type ToastProps = {
    message: string | null
    variant?: ToastVariant
    /** Auto-dismiss after this many ms. Pass 0 to disable auto-dismiss. */
    duration?: number
    /** Vertical offset in pixels from the top, to allow stacking multiple toasts. */
    topOffset?: number
    onClose: () => void
}

export function ToastCard({
    id,
    message,
    variant = "success",
    duration = 4500,
    onDismiss,
}: {
    id: string
    message: string
    variant?: ToastVariant
    duration?: number
    onDismiss: (id: string) => void
}) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            requestAnimationFrame(() => setVisible(true))
        })
        return () => cancelAnimationFrame(raf)
    }, [])

    useEffect(() => {
        if (duration <= 0) {
            return
        }

        const timer = window.setTimeout(() => {
            setVisible(false)
            window.setTimeout(() => onDismiss(id), 250)
        }, duration)

        return () => {
            window.clearTimeout(timer)
        }
    }, [id, duration, onDismiss])

    const handleClose = () => {
        setVisible(false)
        setTimeout(() => onDismiss(id), 250)
    }

    const Icon =
        variant === "success"
            ? CheckCircle2
            : variant === "error"
                ? XCircle
                : Info

    const styles =
        variant === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : variant === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-100 bg-blue-50 text-blue-800"

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(-8px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
            className={[
                "pointer-events-auto w-full rounded-xl border px-4 py-3 shadow-lg",
                styles,
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0" />

                <p className="min-w-0 flex-1 text-sm font-medium leading-5">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={handleClose}
                    className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                    aria-label="Dismiss notification"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    )
}

export function ToastStack({
    toasts,
    onDismiss,
}: {
    toasts: ToastItemData[]
    onDismiss: (id: string) => void
}) {
    if (toasts.length === 0) {
        return null
    }

    return (
        <div
            className="fixed top-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none w-[min(420px,calc(100vw-2.5rem))]"
            role="region"
            aria-label="Notifications"
        >
            {toasts.map((toast) => (
                <ToastCard
                    key={toast.id}
                    id={toast.id}
                    message={toast.message}
                    variant={toast.variant}
                    duration={toast.duration}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    )
}

export function Toast({
    message,
    variant = "success",
    duration = 4000,
    topOffset = 20,
    onClose,
}: ToastProps) {
    const [visible, setVisible] = useState(false)
    const prevMessage = useRef<string | null>(null)

    // Animate in whenever a new (non-null) message arrives
    useEffect(() => {
        if (message && message !== prevMessage.current) {
            prevMessage.current = message
            const raf = requestAnimationFrame(() => {
                setVisible(true)
            })
            return () => cancelAnimationFrame(raf)
        }
        if (!message) {
            prevMessage.current = null
        }
    }, [message])

    // Auto-dismiss timer
    useEffect(() => {
        if (!message || duration <= 0) {
            return
        }

        const timer = window.setTimeout(() => {
            setVisible(false)
            // Give the fade-out animation time before removing
            window.setTimeout(onClose, 300)
        }, duration)

        return () => {
            window.clearTimeout(timer)
        }
    }, [message, duration, onClose])

    if (!message) {
        return null
    }

    const Icon =
        variant === "success"
            ? CheckCircle2
            : variant === "error"
                ? XCircle
                : Info

    const styles =
        variant === "success"
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : variant === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-blue-100 bg-blue-50 text-blue-800"

    return (
        <div
            role="status"
            aria-live="polite"
            style={{
                top: topOffset,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(-12px)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
            className={[
                "fixed right-5 z-[100] w-[min(420px,calc(100vw-2.5rem))]",
                "rounded-xl border px-4 py-3 shadow-lg",
                styles,
            ].join(" ")}
        >
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0" />

                <p className="min-w-0 flex-1 text-sm font-medium leading-5">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={() => {
                        setVisible(false)
                        setTimeout(onClose, 300)
                    }}
                    className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                    aria-label="Dismiss notification"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    )
}