from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from app.models.user import UserRole

class AdminUserStatusUpdate(BaseModel):
    is_active: bool
    reason: Optional[str] = "Administrative status change"

class AdminUserRoleUpdate(BaseModel):
    role: UserRole
    reason: Optional[str] = "Administrative role change"

class AdminResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, max_length=128)

class AdminRefundOrderRequest(BaseModel):
    reason: str = Field("Customer refund requested", min_length=3, max_length=500)

class AdminDashboardStats(BaseModel):
    total_customers: int
    total_products: int
    total_orders: int
    total_revenue: Decimal
    active_reservations: int
    pending_orders: int
    failed_payments: int
