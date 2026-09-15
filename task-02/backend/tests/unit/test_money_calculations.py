from decimal import Decimal

def test_decimal_money_precision():
    # Demonstrating floating-point inaccuracies do not happen with Decimal
    # In float: 0.1 + 0.2 = 0.30000000000000004
    p1 = Decimal("19.99")
    p2 = Decimal("0.01")
    total = p1 + p2
    assert total == Decimal("20.00")
    
    qty = 3
    unit_price = Decimal("33.33")
    subtotal = unit_price * qty
    assert subtotal == Decimal("99.99")
