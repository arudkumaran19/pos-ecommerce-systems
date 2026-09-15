import React, { createContext, useContext, useState, useEffect } from 'react';
import { Cart } from '../types';
import { apiRequest } from '../lib/api-client';
import { useAuth } from './AuthContext';

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  refreshCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshCart = async () => {
    if (!user) {
      setCart(null);
      return;
    }
    try {
      setLoading(true);
      const cartData = await apiRequest<Cart>('/api/v1/cart');
      setCart(cartData);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const addItem = async (productId: string, quantity: number = 1) => {
    const updated = await apiRequest<Cart>('/api/v1/cart/items', {
      method: 'POST',
      body: { product_id: productId, quantity },
    });
    setCart(updated);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    const updated = await apiRequest<Cart>(`/api/v1/cart/items/${itemId}`, {
      method: 'PATCH',
      body: { quantity },
    });
    setCart(updated);
  };

  const removeItem = async (itemId: string) => {
    const updated = await apiRequest<Cart>(`/api/v1/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    setCart(updated);
  };

  const clearCart = async () => {
    const updated = await apiRequest<Cart>('/api/v1/cart', {
      method: 'DELETE',
    });
    setCart(updated);
  };

  const totalItems = cart?.total_quantity || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        refreshCart,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
