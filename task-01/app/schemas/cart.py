from pydantic import BaseModel, Field


class CartItemCreate(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(gt=0)

class CartItemUpdate(BaseModel):
    quantity: int = Field(gt=0)

class CartItemResponse(BaseModel):
    product_id: int
    quantity: int

    model_config = {
        "from_attributes": True,
    }


class CartCreate(BaseModel):
    pass


class CartResponse(BaseModel):
    id: int
    status: str
    items: list[CartItemResponse]

    model_config = {
        "from_attributes": True,
    }