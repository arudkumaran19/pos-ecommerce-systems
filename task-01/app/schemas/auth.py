from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1)


class UserResponse(BaseModel):
    id: int
    email: str
    display_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=12)
    display_name: str = Field(min_length=1, max_length=100)
    role: str = Field(default="cashier")


class UserUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=100)
    role: str | None = Field(default=None)
    is_active: bool | None = Field(default=None)
    password: str | None = Field(default=None, min_length=12)


class LoginResponse(BaseModel):
    message: str = "Login successful"
    user: UserResponse


class MessageResponse(BaseModel):
    message: str
