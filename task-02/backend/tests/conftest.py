import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.database import engine, SessionLocal, Base
from app.main import app
from app.models.user import User, UserRole
from app.models.product import Product
from app.core.security import hash_password
from decimal import Decimal

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def sample_product(db: Session):
    product = Product(
        name="Test Wireless Headphones",
        slug="test-wireless-headphones",
        description="High fidelity test headphones",
        category="Audio",
        price=Decimal("199.99"),
        available_stock=10,
        is_active=True
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product

def register_and_login_user(client: TestClient, email: str, role: UserRole = UserRole.CUSTOMER):
    # Register
    res = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Test User",
        "password": "SecurePassword123!"
    })
    csrf_token = res.json().get("csrf_token")
    
    # If admin role needed, update in DB
    if role == UserRole.ADMIN:
        db = SessionLocal()
        user = db.query(User).filter(User.email == email.lower()).first()
        if user:
            user.role = UserRole.ADMIN
            db.commit()
        db.close()
        
    return csrf_token
