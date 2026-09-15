from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from app.schemas.common import BaseSchema

class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=16)
    new_password: str = Field(..., min_length=8, max_length=128)

class AuthSuccessResponse(BaseModel):
    message: str
    csrf_token: str

class CsrfTokenResponse(BaseModel):
    csrf_token: str

