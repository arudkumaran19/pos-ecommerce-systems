import uuid
from fastapi.testclient import TestClient

def test_catalog_search_and_filtering(client: TestClient):
    # Catalog listing
    res = client.get("/api/v1/products?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) > 0
    assert "total" in data
    
    # Filter by category
    cat_res = client.get("/api/v1/products?category=Audio")
    assert cat_res.status_code == 200
    for item in cat_res.json()["items"]:
        assert item["category"].lower() == "audio"
        
    # Search by keyword
    search_res = client.get("/api/v1/products?q=Headphones")
    assert search_res.status_code == 200
    assert len(search_res.json()["items"]) > 0

def test_cart_operations(client: TestClient):
    email = f"cart_tester_{uuid.uuid4().hex[:8]}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Cart Tester",
        "password": "Password123!"
    })
    csrf = reg.json()["csrf_token"]
    
    # Get in-stock products
    products = client.get("/api/v1/products?in_stock_only=true").json()["items"]
    assert len(products) > 0
    product = products[0]
    
    # Add to cart
    add_res = client.post(
        "/api/v1/cart/items",
        json={"product_id": product["id"], "quantity": 2},
        headers={"X-CSRF-Token": csrf}
    )
    assert add_res.status_code == 200
    cart_data = add_res.json()
    assert cart_data["total_quantity"] == 2
    assert len(cart_data["items"]) == 1
    item_id = cart_data["items"][0]["id"]
    
    # Update quantity
    update_res = client.patch(
        f"/api/v1/cart/items/{item_id}",
        json={"quantity": 3},
        headers={"X-CSRF-Token": csrf}
    )
    assert update_res.status_code == 200
    assert update_res.json()["total_quantity"] == 3
    
    # Remove item
    del_res = client.delete(
        f"/api/v1/cart/items/{item_id}",
        headers={"X-CSRF-Token": csrf}
    )
    assert del_res.status_code == 200
    assert del_res.json()["total_quantity"] == 0
