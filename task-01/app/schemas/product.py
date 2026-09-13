from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    price: Decimal = Field(ge=0, decimal_places=2)
    available_stock: int = Field(ge=0)


class ProductUpdate(BaseModel):
    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=255,
    )
    price: Decimal | None = Field(
        default=None,
        ge=0,
        decimal_places=2,
    )
    available_stock: int | None = Field(
        default=None,
        ge=0,
    )


class ProductResponse(BaseModel):
    id: int
    name: str
    price: Decimal
    available_stock: int

    model_config = ConfigDict(from_attributes=True)