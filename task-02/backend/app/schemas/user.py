from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.models.user import UserRole
from app.schemas.common import BaseSchema

class UserResponse(BaseSchema):
    id: UUID
    email: str
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None
    is_active: bool
    csrf_token: Optional[str] = None
    created_at: datetime


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)

class ChangeEmailRequest(BaseModel):
    new_email: EmailStr
    current_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_new_password: str
