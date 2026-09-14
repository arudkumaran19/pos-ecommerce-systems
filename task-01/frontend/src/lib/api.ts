const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000"

export type Product = {
    id: number
    name: string
    price: string
    available_stock: number
    is_active: boolean
}

export type ProductCreate = {
    name: string
    price: number
    available_stock: number
}

export type ProductUpdate = {
    name?: string
    price?: number
    available_stock?: number
    is_active?: boolean
}

export type CartItem = {
    product_id: number
    quantity: number
}

export type Cart = {
    id: number
    status: string
    items: CartItem[]
}

export type OrderItem = {
    product_id: number
    product_name: string
    quantity: number
    unit_price: string
}

export type Order = {
    id: number
    cart_id: number
    status: string
    items: OrderItem[]
    created_at: string        // ISO-8601 UTC
    completed_at: string | null
}

export type CheckoutResponse = {
    order: Order
    reservation_expires_at: string
}

export type PaymentOutcome = "success" | "failure" | "timeout"

export type PaymentRequest = {
    idempotency_key: string
    outcome: PaymentOutcome
}

export type PaymentResponse = {
    id: number
    order_id: number
    idempotency_key: string
    status: string
    processed_at: string | null
}

async function request<T>(
    path: string,
    options?: RequestInit,
): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
            "Content-Type": "application/json",
            ...options?.headers,
        },
        ...options,
    })

    if (!response.ok) {
        let message = `Request failed with status ${response.status}`

        try {
            const error = await response.json()

            if (typeof error?.detail === "string") {
                message = error.detail
            } else if (Array.isArray(error?.detail)) {
                // FastAPI 422 validation errors — each entry has msg + loc
                message = error.detail
                    .map((e: { msg?: string; loc?: string[] }) =>
                        e.msg ?? JSON.stringify(e),
                    )
                    .join("; ")
            }
        } catch {
            // Keep the default HTTP error message.
        }

        throw new Error(message)
    }

    if (response.status === 204) {
        return undefined as T
    }

    return response.json() as Promise<T>
}

export async function getProducts(): Promise<Product[]> {
    return request<Product[]>("/products")
}

export async function getProduct(productId: number): Promise<Product> {
    return request<Product>(`/products/${productId}`)
}

export async function createProduct(
    product: ProductCreate,
): Promise<Product> {
    return request<Product>("/products", {
        method: "POST",
        body: JSON.stringify(product),
    })
}

export async function updateProduct(
    productId: number,
    product: ProductUpdate,
): Promise<Product> {
    return request<Product>(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(product),
    })
}

export async function deleteProduct(productId: number): Promise<void> {
    return request<void>(`/products/${productId}`, {
        method: "DELETE",
    })
}

export async function createCart(): Promise<Cart> {
    return request<Cart>("/carts", {
        method: "POST",
        body: JSON.stringify({}),
    })
}

export async function getCart(cartId: number): Promise<Cart> {
    return request<Cart>(`/carts/${cartId}`)
}

export async function addCartItem(
    cartId: number,
    productId: number,
    quantity: number,
): Promise<Cart> {
    return request<Cart>(`/carts/${cartId}/items`, {
        method: "POST",
        body: JSON.stringify({
            product_id: productId,
            quantity,
        }),
    })
}

export async function removeCartItem(
    cartId: number,
    productId: number,
): Promise<Cart> {
    return request<Cart>(
        `/carts/${cartId}/items/${productId}`,
        {
            method: "DELETE",
        },
    )
}

export async function updateCartItemQuantity(
    cartId: number,
    productId: number,
    quantity: number,
): Promise<Cart> {
    return request<Cart>(
        `/carts/${cartId}/items/${productId}`,
        {
            method: "PATCH",
            body: JSON.stringify({
                quantity,
            }),
        },
    )
}


export async function checkoutCart(
    cartId: number,
): Promise<CheckoutResponse> {
    return request<CheckoutResponse>(
        `/carts/${cartId}/checkout`,
        {
            method: "POST",
        },
    )
}

export async function processPayment(
    orderId: number,
    payment: PaymentRequest,
): Promise<PaymentResponse> {
    return request<PaymentResponse>(
        `/payments/orders/${orderId}`,
        {
            method: "POST",
            body: JSON.stringify(payment),
        },
    )
}

export async function getOrders(): Promise<Order[]> {
    return request<Order[]>("/orders")
}

export async function getOrder(orderId: number): Promise<Order> {
    return request<Order>(`/orders/${orderId}`)
}

export async function cancelOrder(orderId: number): Promise<Order> {
    return request<Order>(`/orders/${orderId}/cancel`, {
        method: "POST",
    })
}