import { useEffect, useState } from "react"
import {
    CheckCircle2,
    Info,
    X,
    XCircle,
} from "lucide-react"

type ToastVariant = "success" | "error" | "info"

type ToastProps = {
    message: string | null
    variant?: ToastVariant
    duration?: number
    onClose: () => void
}

export function Toast({
                          message,
                          variant = "success",
                          duration = 5000,
                          onClose,
                      }: ToastProps) {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (!message) {
            setVisible(false)
            return
        }

        setVisible(true)

        if (duration <= 0) {
            return
        }

        const timer = window.setTimeout(() => {
            setVisible(false)
        }, duration)

        return () => {
            window.clearTimeout(timer)
        }
    }, [message, duration])

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
                : "border-zinc-200 bg-white text-zinc-800"

    return (
        <div
            className={[
                "fixed right-5 top-5 z-[100] w-[min(420px,calc(100vw-2.5rem))]",
                "rounded-xl border px-4 py-3 shadow-lg",
                "transition-all duration-300 ease-out",
                visible
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-2 opacity-0",
                styles,
            ].join(" ")}
            onTransitionEnd={(event) => {
                if (
                    event.propertyName === "opacity" &&
                    !visible
                ) {
                    onClose()
                }
            }}
            role="status"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <Icon className="mt-0.5 size-5 shrink-0" />

                <p className="min-w-0 flex-1 text-sm font-medium leading-5">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={() => setVisible(false)}
                    className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:bg-black/5 hover:opacity-100"
                    aria-label="Dismiss notification"
                >
                    <X className="size-4" />
                </button>
            </div>
        </div>
    )
}