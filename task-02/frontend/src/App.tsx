import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import { LoadingScreen } from './components/common/LoadingScreen';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';
import { CheckoutLayout } from './components/layout/CheckoutLayout';

// Storefront Pages
import { StorePage } from './pages/storefront/StorePage';
import { ProductDetailPage } from './pages/storefront/ProductDetailPage';
import { CartPage } from './pages/storefront/CartPage';
import { CheckoutPage } from './pages/storefront/CheckoutPage';
import { PaymentPage } from './pages/storefront/PaymentPage';
import { OrderConfirmationPage } from './pages/storefront/OrderConfirmationPage';
import { MyOrdersPage } from './pages/storefront/MyOrdersPage';
import { OrderDetailPage } from './pages/storefront/OrderDetailPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Account Pages
import { ProfilePage } from './pages/account/ProfilePage';
import { SecurityPage } from './pages/account/SecurityPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminProductsPage } from './pages/admin/AdminProductsPage';
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

// Storefront Shell with sticky Navbar & Footer
const StorefrontLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#080A0F] text-[#F5F3EE] flex flex-col selection:bg-[#4FB7A5]/20 selection:text-[#F5F3EE]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Route Guard for authenticated users
const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen message="Loading…" submessage="Please wait a moment" />;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
};

// Route Guard for guests only (redirects logged-in users away from /login, /register)
const GuestRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen message="Loading…" submessage="Please wait a moment" />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              {/* Storefront Layout Routes (with Global Navbar + Footer) */}
              <Route element={<StorefrontLayout />}>
                {/* Public Storefront */}
                <Route path="/" element={<StorePage />} />
                <Route path="/products/:slug" element={<ProductDetailPage />} />

                {/* Guest Auth Pages */}
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>

                {/* Customer Account & Order Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/orders/confirmation/:id" element={<OrderConfirmationPage />} />
                  <Route path="/orders" element={<MyOrdersPage />} />
                  <Route path="/orders/:id" element={<OrderDetailPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/security" element={<SecurityPage />} />
                </Route>
              </Route>

              {/* Dedicated Checkout Flow (Cart ── Delivery ── Payment) with Unified Minimal Shell */}
              <Route element={<CheckoutLayout />}>
                <Route path="/cart" element={<CartPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/payment/:orderId" element={<PaymentPage />} />
                </Route>
              </Route>

              {/* Protected Admin Routes (Rendered inside AdminLayout fixed shell) */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
