export type UserRole = "cashier" | "manager"

export type User = {
    id: number
    email: string
    display_name: string
    role: UserRole
    is_active: boolean
    created_at: string
}

export type LoginResponse = {
    message: string
    user: User
}

export type CreateUserData = {
    email: string
    password: string
    display_name: string
    role: UserRole
}

export type UpdateUserData = {
    display_name?: string
    role?: UserRole
    is_active?: boolean
    password?: string
}
