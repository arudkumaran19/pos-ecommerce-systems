from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, List, Optional

T = TypeVar("T")

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class MessageResponse(BaseModel):
    message: str
    code: Optional[str] = "SUCCESS"

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    total_pages: int
