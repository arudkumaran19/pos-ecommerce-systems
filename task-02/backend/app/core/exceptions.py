from fastapi import HTTPException, status

class DomainException(HTTPException):
    def __init__(self, status_code: int, detail: str, code: str = "DOMAIN_ERROR"):
        super().__init__(status_code=status_code, detail={"message": detail, "code": code})

class NotFoundException(DomainException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail, code="NOT_FOUND")

class BadRequestException(DomainException):
    def __init__(self, detail: str = "Bad request"):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, code="BAD_REQUEST")

class UnauthorizedException(DomainException):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, code="UNAUTHORIZED")

class ForbiddenException(DomainException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail, code="FORBIDDEN")

class ConflictException(DomainException):
    def __init__(self, detail: str = "Conflict"):
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail=detail, code="CONFLICT")

class InsufficientStockException(ConflictException):
    def __init__(self, product_name: str, requested: int, available: int):
        super().__init__(
            detail=f"Insufficient stock for product '{product_name}'. Requested: {requested}, available: {available}."
        )

class ProductInactiveException(BadRequestException):
    def __init__(self, product_name: str):
        super().__init__(detail=f"Product '{product_name}' is currently unavailable for purchase.")

class IdempotencyConflictException(ConflictException):
    def __init__(self, detail: str = "A request with this idempotency key is currently in progress."):
        super().__init__(detail=detail)

class IdempotencyPayloadMismatchException(DomainException):
    def __init__(self, detail: str = "Idempotency key has already been used with a different request payload."):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail, code="IDEMPOTENCY_PAYLOAD_MISMATCH")

class InvalidStateTransitionException(ConflictException):
    def __init__(self, current_state: str, attempted_state: str, entity: str = "Entity"):
        super().__init__(detail=f"Cannot transition {entity} from {current_state} to {attempted_state}.")
