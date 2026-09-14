import { useEffect, useMemo, useState } from "react"
import {
    AlertCircle,
    CheckCircle2,
    Edit3,
    Eye,
    EyeOff,
    RefreshCw,
    Search,
    ShieldCheck,
    Trash2,
    UserCheck,
    UserPlus,
    Users,
    UserX,
    X,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"
import {
    createUser,
    deleteUser,
    getUsers,
    updateUser,
} from "../../lib/api"
import type { CreateUserData, UpdateUserData, User } from "../../types/auth"
import { Toast } from "../ui/Toast"

type UserFilter = "all" | "manager" | "cashier" | "active" | "inactive"

export function UserManagementView() {
    const { user: currentUser } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [toastMessage, setToastMessage] = useState<string | null>(null)
    const [toastVariant, setToastVariant] = useState<"success" | "error">("success")

    // Filter and search state
    const [searchQuery, setSearchQuery] = useState("")
    const [filter, setFilter] = useState<UserFilter>("all")

    // Modal states
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [userToEdit, setUserToEdit] = useState<User | null>(null)
    const [userToDelete, setUserToDelete] = useState<User | null>(null)

    // Form states
    const [formData, setFormData] = useState<CreateUserData>({
        email: "",
        display_name: "",
        role: "cashier",
        password: "",
    })
    const [editFormData, setEditFormData] = useState<UpdateUserData>({
        display_name: "",
        role: "cashier",
        is_active: true,
        password: "",
    })
    const [showPassword, setShowPassword] = useState(false)
    const [modalError, setModalError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    async function refreshUsers(showRefreshAnimation = false) {
        if (showRefreshAnimation) setRefreshing(true)
        else setLoading(true)
        setError(null)

        try {
            const data = await getUsers()
            setUsers(data)
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to load team operators."
            setError(msg)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    useEffect(() => {
        let ignore = false
        getUsers()
            .then((data) => {
                if (!ignore) {
                    setUsers(data)
                    setLoading(false)
                }
            })
            .catch((err) => {
                if (!ignore) {
                    const msg = err instanceof Error ? err.message : "Failed to load team operators."
                    setError(msg)
                    setLoading(false)
                }
            })

        return () => {
            ignore = true
        }
    }, [])

    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const matchesSearch =
                u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email.toLowerCase().includes(searchQuery.toLowerCase())

            if (!matchesSearch) return false

            if (filter === "manager") return u.role === "manager"
            if (filter === "cashier") return u.role === "cashier"
            if (filter === "active") return u.is_active
            if (filter === "inactive") return !u.is_active
            return true
        })
    }, [users, searchQuery, filter])

    const stats = useMemo(() => {
        const total = users.length
        const managers = users.filter((u) => u.role === "manager" && u.is_active).length
        const cashiers = users.filter((u) => u.role === "cashier" && u.is_active).length
        const inactive = users.filter((u) => !u.is_active).length
        return { total, managers, cashiers, inactive }
    }, [users])

    function openAddModal() {
        setFormData({
            email: "",
            display_name: "",
            role: "cashier",
            password: "",
        })
        setShowPassword(false)
        setModalError(null)
        setIsAddModalOpen(true)
    }

    function openEditModal(target: User) {
        setUserToEdit(target)
        setEditFormData({
            display_name: target.display_name,
            role: target.role,
            is_active: target.is_active,
            password: "",
        })
        setShowPassword(false)
        setModalError(null)
        setIsEditModalOpen(true)
    }

    async function handleCreateUser(e: React.FormEvent) {
        e.preventDefault()
        setModalError(null)

        if (!formData.display_name.trim() || !formData.email.trim() || !formData.password) {
            setModalError("Please complete all required fields.")
            return
        }

        if (formData.password.length < 12) {
            setModalError("Password must be at least 12 characters long.")
            return
        }

        setIsSubmitting(true)
        try {
            const newUser = await createUser(formData)
            setUsers((prev) => [...prev, newUser])
            setIsAddModalOpen(false)
            setToastVariant("success")
            setToastMessage(`Operator "${newUser.display_name}" created successfully.`)
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to create operator."
            setModalError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleUpdateUser(e: React.FormEvent) {
        e.preventDefault()
        if (!userToEdit) return
        setModalError(null)

        if (editFormData.password && editFormData.password.length < 12) {
            setModalError("New password must be at least 12 characters long.")
            return
        }

        const payload: UpdateUserData = {
            display_name: editFormData.display_name?.trim(),
            role: editFormData.role,
            is_active: editFormData.is_active,
        }

        if (editFormData.password && editFormData.password.trim().length > 0) {
            payload.password = editFormData.password.trim()
        }

        setIsSubmitting(true)
        try {
            const updated = await updateUser(userToEdit.id, payload)
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
            setIsEditModalOpen(false)
            setToastVariant("success")
            setToastMessage(`Operator "${updated.display_name}" updated successfully.`)
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update operator."
            setModalError(msg)
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleToggleActive(target: User) {
        if (target.id === currentUser?.id) {
            setToastVariant("error")
            setToastMessage("You cannot deactivate your own account.")
            return
        }

        const newStatus = !target.is_active
        try {
            const updated = await updateUser(target.id, { is_active: newStatus })
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
            setToastVariant("success")
            setToastMessage(
                newStatus
                    ? `Operator "${target.display_name}" activated.`
                    : `Operator "${target.display_name}" suspended. Active sessions terminated.`,
            )
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to toggle operator status."
            setToastVariant("error")
            setToastMessage(msg)
        }
    }

    async function handleDeleteUser() {
        if (!userToDelete) return
        if (userToDelete.id === currentUser?.id) {
            setToastVariant("error")
            setToastMessage("You cannot delete your own account.")
            setUserToDelete(null)
            return
        }

        try {
            await deleteUser(userToDelete.id)
            setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
            setToastVariant("success")
            setToastMessage(`Operator "${userToDelete.display_name}" permanently deleted.`)
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to delete operator."
            setToastVariant("error")
            setToastMessage(msg)
        } finally {
            setUserToDelete(null)
        }
    }

    return (
        <div className="flex-1 space-y-6 p-6 overflow-y-auto max-w-7xl mx-auto">
            {toastMessage && (
                <Toast
                    message={toastMessage}
                    variant={toastVariant}
                    onClose={() => setToastMessage(null)}
                />
            )}

            {/* Header section */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-stone-100">
                                Team & Operator Management
                            </h1>
                            <p className="text-xs text-stone-400">
                                Provision cashier & manager accounts, manage credentials, and control register privileges.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        type="button"
                        onClick={() => refreshUsers(true)}
                        disabled={refreshing || loading}
                        className="flex items-center gap-1.5 rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-xs font-semibold text-stone-300 transition-colors hover:bg-stone-800 hover:text-white disabled:opacity-50"
                        title="Refresh list"
                    >
                        <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-amber-400" : ""}`} />
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-600/20 transition-all hover:from-amber-500 hover:to-amber-600 active:scale-95"
                    >
                        <UserPlus className="size-4" />
                        <span>Add Operator</span>
                    </button>
                </div>
            </div>

            {/* Stat Capsules */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-stone-800/80 bg-[#161412] p-4 shadow-sm">
                    <div className="flex items-center justify-between text-stone-400">
                        <span className="text-xs font-medium">Total Staff</span>
                        <Users className="size-4 text-stone-500" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-stone-100">{stats.total}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Configured terminal operators</p>
                </div>

                <div className="rounded-2xl border border-stone-800/80 bg-[#161412] p-4 shadow-sm">
                    <div className="flex items-center justify-between text-amber-400/90">
                        <span className="text-xs font-medium">Managers</span>
                        <ShieldCheck className="size-4 text-amber-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-amber-400">{stats.managers}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Catalog & user admin rights</p>
                </div>

                <div className="rounded-2xl border border-stone-800/80 bg-[#161412] p-4 shadow-sm">
                    <div className="flex items-center justify-between text-sky-400/90">
                        <span className="text-xs font-medium">Cashiers</span>
                        <UserCheck className="size-4 text-sky-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-sky-400">{stats.cashiers}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Register & order processing</p>
                </div>

                <div className="rounded-2xl border border-stone-800/80 bg-[#161412] p-4 shadow-sm">
                    <div className="flex items-center justify-between text-rose-400/90">
                        <span className="text-xs font-medium">Suspended</span>
                        <UserX className="size-4 text-rose-400" />
                    </div>
                    <p className="mt-2 text-2xl font-bold text-rose-400">{stats.inactive}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Revoked access accounts</p>
                </div>
            </div>

            {/* Filter and Search controls */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-stone-800/80 bg-[#161412] p-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto size-4 text-stone-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full rounded-xl border border-stone-800 bg-stone-900/90 py-1.5 pl-9 pr-3 text-xs text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {(
                        [
                            { id: "all", label: "All" },
                            { id: "manager", label: "Managers" },
                            { id: "cashier", label: "Cashiers" },
                            { id: "active", label: "Active" },
                            { id: "inactive", label: "Suspended" },
                        ] as const
                    ).map((btn) => (
                        <button
                            key={btn.id}
                            type="button"
                            onClick={() => setFilter(btn.id)}
                            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                                filter === btn.id
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm"
                                    : "text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                            }`}
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Users Table / List */}
            <div className="overflow-hidden rounded-2xl border border-stone-800/80 bg-[#161412] shadow-xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-stone-500 gap-2">
                        <RefreshCw className="size-6 animate-spin text-amber-500" />
                        <span className="text-xs font-medium">Loading operators...</span>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <AlertCircle className="mx-auto size-8 text-rose-500" />
                        <p className="mt-2 text-sm font-semibold text-rose-300">{error}</p>
                        <button
                            type="button"
                            onClick={() => refreshUsers()}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-200 hover:bg-stone-700"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-16 text-center text-stone-500">
                        <Users className="mx-auto size-8 text-stone-600" />
                        <p className="mt-2 text-sm font-semibold text-stone-300">No operators found</p>
                        <p className="mt-0.5 text-xs text-stone-500">
                            {searchQuery ? "Try refining your search filter." : "Click 'Add Operator' to provision an account."}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-stone-800 bg-stone-900/50 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                                <tr>
                                    <th className="py-3.5 pl-5 pr-3">Operator</th>
                                    <th className="px-3 py-3.5">Email</th>
                                    <th className="px-3 py-3.5">Role</th>
                                    <th className="px-3 py-3.5">Status</th>
                                    <th className="px-3 py-3.5">Created</th>
                                    <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800/60 font-medium text-stone-300">
                                {filteredUsers.map((u) => {
                                    const isSelf = u.id === currentUser?.id
                                    const initials = u.display_name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .slice(0, 2)
                                        .join("")
                                        .toUpperCase()

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`transition-colors hover:bg-stone-800/30 ${
                                                !u.is_active ? "opacity-60 bg-stone-950/30" : ""
                                            }`}
                                        >
                                            <td className="py-3.5 pl-5 pr-3">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex size-8 items-center justify-center rounded-xl text-xs font-bold ${
                                                            u.role === "manager"
                                                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                                                : "bg-stone-800 text-stone-300 border border-stone-700"
                                                        }`}
                                                    >
                                                        {initials || "OP"}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="font-semibold text-stone-100">
                                                                {u.display_name}
                                                            </span>
                                                            {isSelf && (
                                                                <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold text-amber-300 uppercase">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-stone-500">ID #{u.id}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-3.5 text-stone-300 font-mono text-[11px]">
                                                {u.email}
                                            </td>
                                            <td className="px-3 py-3.5">
                                                {u.role === "manager" ? (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
                                                        <ShieldCheck className="size-3 text-amber-400" />
                                                        Manager
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-300">
                                                        <UserCheck className="size-3 text-sky-400" />
                                                        Cashier
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3.5">
                                                {u.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                                                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
                                                        <UserX className="size-3 text-rose-400" />
                                                        Suspended
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3.5 text-[11px] text-stone-400">
                                                {new Date(u.created_at).toLocaleDateString(undefined, {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </td>
                                            <td className="py-3.5 pl-3 pr-5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {/* Toggle active */}
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() => handleToggleActive(u)}
                                                        title={
                                                            isSelf
                                                                ? "Cannot suspend your own account"
                                                                : u.is_active
                                                                ? "Suspend operator"
                                                                : "Activate operator"
                                                        }
                                                        className={`rounded-lg p-1.5 transition-colors ${
                                                            isSelf
                                                                ? "cursor-not-allowed opacity-30 text-stone-600"
                                                                : u.is_active
                                                                ? "text-stone-400 hover:bg-rose-500/15 hover:text-rose-300"
                                                                : "text-stone-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                                                        }`}
                                                    >
                                                        {u.is_active ? (
                                                            <UserX className="size-3.5" />
                                                        ) : (
                                                            <CheckCircle2 className="size-3.5 text-emerald-400" />
                                                        )}
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(u)}
                                                        title="Edit operator"
                                                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-800 hover:text-amber-300"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        type="button"
                                                        disabled={isSelf}
                                                        onClick={() => setUserToDelete(u)}
                                                        title={
                                                            isSelf
                                                                ? "Cannot delete your own account"
                                                                : "Delete operator"
                                                        }
                                                        className={`rounded-lg p-1.5 transition-colors ${
                                                            isSelf
                                                                ? "cursor-not-allowed opacity-30 text-stone-600"
                                                                : "text-stone-400 hover:bg-rose-500/15 hover:text-rose-300"
                                                        }`}
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL: ADD OPERATOR */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-[#161412] p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                    <UserPlus className="size-4" />
                                </div>
                                <h2 className="text-base font-bold text-stone-100">Add New Operator</h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="rounded-lg p-1 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
                                <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateUser} className="mt-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Operator Display Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.display_name}
                                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="e.g. Maya Lin"
                                    className="w-full rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="e.g. maya@techloom.com"
                                    className="w-full rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Operator Role *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: "cashier" })}
                                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                                            formData.role === "cashier"
                                                ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
                                                : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                            <UserCheck className="size-3.5 text-sky-400" />
                                            <span>Cashier</span>
                                        </div>
                                        <span className="mt-1 text-[10px] text-stone-400 leading-tight">
                                            Register, Cart, Orders & Payments
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: "manager" })}
                                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                                            formData.role === "manager"
                                                ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                                                : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                            <ShieldCheck className="size-3.5 text-amber-400" />
                                            <span>Manager</span>
                                        </div>
                                        <span className="mt-1 text-[10px] text-stone-400 leading-tight">
                                            Catalog CRUD, Staff & Inventory
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Initial Password * (Minimum 12 Characters)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        minLength={12}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••••••"
                                        className="w-full rounded-xl border border-stone-800 bg-stone-900/80 py-2 pl-3 pr-9 text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-500 hover:text-stone-300"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    </button>
                                </div>
                                <p className="mt-1 text-[10px] text-stone-500">
                                    Enforces security standard: minimum 12 characters.
                                </p>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2 font-semibold text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2 font-semibold text-white shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="size-3.5 animate-spin" />
                                            <span>Creating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="size-3.5" />
                                            <span>Create Operator</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: EDIT OPERATOR */}
            {isEditModalOpen && userToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="w-full max-w-md rounded-3xl border border-stone-800 bg-[#161412] p-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
                            <div className="flex items-center gap-2">
                                <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                    <Edit3 className="size-4" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-stone-100">Edit Operator</h2>
                                    <p className="text-[11px] text-stone-500 font-mono">{userToEdit.email}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsEditModalOpen(false)}
                                className="rounded-lg p-1 text-stone-500 hover:bg-stone-800 hover:text-stone-300"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {modalError && (
                            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-900/50 bg-rose-950/40 p-3 text-xs text-rose-300">
                                <AlertCircle className="size-4 shrink-0 text-rose-400 mt-0.5" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <form onSubmit={handleUpdateUser} className="mt-4 space-y-4 text-xs">
                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Operator Display Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={editFormData.display_name}
                                    onChange={(e) =>
                                        setEditFormData({ ...editFormData, display_name: e.target.value })
                                    }
                                    className="w-full rounded-xl border border-stone-800 bg-stone-900/80 px-3 py-2 text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        disabled={userToEdit.id === currentUser?.id}
                                        onClick={() => setEditFormData({ ...editFormData, role: "cashier" })}
                                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                                            userToEdit.id === currentUser?.id
                                                ? "opacity-40 cursor-not-allowed border-stone-800 bg-stone-900/20"
                                                : editFormData.role === "cashier"
                                                ? "border-sky-500/50 bg-sky-500/10 text-sky-200"
                                                : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                            <UserCheck className="size-3.5 text-sky-400" />
                                            <span>Cashier</span>
                                        </div>
                                        <span className="mt-1 text-[10px] text-stone-400 leading-tight">
                                            Standard Register
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        disabled={userToEdit.id === currentUser?.id}
                                        onClick={() => setEditFormData({ ...editFormData, role: "manager" })}
                                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                                            userToEdit.id === currentUser?.id
                                                ? "border-amber-500/50 bg-amber-500/10 text-amber-200 cursor-not-allowed"
                                                : editFormData.role === "manager"
                                                ? "border-amber-500/50 bg-amber-500/10 text-amber-200"
                                                : "border-stone-800 bg-stone-900/40 text-stone-400 hover:border-stone-700"
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-bold text-xs">
                                            <ShieldCheck className="size-3.5 text-amber-400" />
                                            <span>Manager</span>
                                        </div>
                                        <span className="mt-1 text-[10px] text-stone-400 leading-tight">
                                            Admin Privileges
                                        </span>
                                    </button>
                                </div>
                                {userToEdit.id === currentUser?.id && (
                                    <p className="mt-1 text-[10px] text-amber-400/80">
                                        You cannot change your own role.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Account Status
                                </label>
                                <div className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900/60 p-3">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`size-2.5 rounded-full ${
                                                editFormData.is_active ? "bg-emerald-400" : "bg-rose-400"
                                            }`}
                                        />
                                        <div>
                                            <p className="font-semibold text-stone-200">
                                                {editFormData.is_active ? "Active Operator" : "Suspended"}
                                            </p>
                                            <p className="text-[10px] text-stone-500">
                                                {editFormData.is_active
                                                    ? "Able to log in and operate POS"
                                                    : "Access revoked; sessions terminated"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        disabled={userToEdit.id === currentUser?.id}
                                        onClick={() =>
                                            setEditFormData({
                                                ...editFormData,
                                                is_active: !editFormData.is_active,
                                            })
                                        }
                                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                                            userToEdit.id === currentUser?.id
                                                ? "opacity-30 cursor-not-allowed bg-stone-800 text-stone-600"
                                                : editFormData.is_active
                                                ? "border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                                                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                                        }`}
                                    >
                                        {editFormData.is_active ? "Suspend" : "Activate"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-stone-300 mb-1">
                                    Reset Password (Leave blank to keep unchanged)
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={editFormData.password || ""}
                                        onChange={(e) =>
                                            setEditFormData({ ...editFormData, password: e.target.value })
                                        }
                                        placeholder="New password (min 12 characters)"
                                        className="w-full rounded-xl border border-stone-800 bg-stone-900/80 py-2 pl-3 pr-9 text-stone-200 placeholder-stone-600 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-500 hover:text-stone-300"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-800 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2 font-semibold text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-5 py-2 font-semibold text-white shadow-lg shadow-amber-600/20 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="size-3.5 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <span>Save Changes</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: DELETE CONFIRMATION */}
            {userToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
                    <div className="w-full max-w-sm rounded-3xl border border-rose-900/50 bg-[#161412] p-6 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <Trash2 className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-stone-100">Delete Operator Account?</h3>
                                <p className="text-xs text-stone-400">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="mt-4 text-xs text-stone-300 leading-relaxed">
                            Are you sure you want to permanently delete{" "}
                            <strong className="text-white">{userToDelete.display_name}</strong> (
                            <span className="font-mono text-stone-400">{userToDelete.email}</span>)? Active sessions will be terminated immediately.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-2 border-t border-stone-800/80 pt-4">
                            <button
                                type="button"
                                onClick={() => setUserToDelete(null)}
                                className="rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-2 text-xs font-semibold text-stone-400 hover:bg-stone-800 hover:text-stone-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-600/30 hover:bg-rose-500"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
