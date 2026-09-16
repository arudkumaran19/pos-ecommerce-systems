# TechLoom Task 02 — E-Commerce Storefront with Admin Console

> **Completely independent** from Task 01. Zero shared code, models, migrations, database tables, sessions, or API clients.

---

## Live Deployment Links
- **Live Frontend:** https://pos-ecommerce-systems-zb3q.vercel.app
- **Live Backend:** https://pos-ecommerce-systems-production.up.railway.app
- **Repository:** https://github.com/arudkumaran19/pos-ecommerce-systems

## Demo Credentials
### Task 02 Admin:
- **Email:** `admin@techloom.com`
- **Password:** `AdminSecurePass!2026`

*Note: The admin account can use the normal storefront as a customer and also access the dedicated administrative console.*

## Evaluator Testing Instructions
1. Open the live frontend: [https://pos-ecommerce-systems-zb3q.vercel.app](https://pos-ecommerce-systems-zb3q.vercel.app)
2. Sign in using the demo admin credentials (`admin@techloom.com` / `AdminSecurePass!2026`).
3. Browse products on the storefront catalog.
4. Select a product and add it to your shopping cart.
5. Proceed to checkout and submit shipping details to create a 5-minute stock reservation.
6. Proceed to payment. Notice the realistic credit/debit card form with dynamic total amount (`Pay $XX.XX`).
7. Complete the payment flow to view the order confirmation.
8. Navigate to "My Orders" to inspect order history and status.
9. Open the Admin Console from the user navigation menu.
10. Review the operational dashboard KPIs, user directory, product inventory, customer orders, and forensic audit logs.

## Payment Processing
- **Secure Card Payment:** Enter card details and click Pay; the payment gateway processes the payment and transitions the order to `PAID`.
- **Duplicate Payment Protection:** Submissions use automatic idempotency keys; duplicate submissions return cached results without re-charging or modifying stock.
- **Customer Cancellation:** Customers can cancel `RESERVED` orders directly from the order details page, releasing stock immediately.
- **Admin Refund Workflow:** For `PAID` orders, customer direct refund is prevented. Administrators inspect paid orders in the Admin Console and execute refunds with reason tracking and forensic audit logging.
- **Reservation Expiry:** A background sweeper daemon releases reservations after 5 minutes (`RESERVATION_TTL_SECONDS=300`) if unpaid, restoring product inventory.

---

## Architecture at a Glance

```
task-02/
├── backend/               FastAPI + PostgreSQL (port 8000, DB port 5434)
│   ├── app/
│   │   ├── api/v1/        REST endpoints + admin sub-router
│   │   ├── core/          Config, DB engine, security (Argon2id, SHA-256, CSRF)
│   │   ├── models/        SQLAlchemy 2.x ORM models
│   │   ├── repositories/  Thin data-access layer (SELECT … FOR UPDATE + populate_existing)
│   │   ├── schemas/       Pydantic v2 request / response schemas
│   │   └── services/      Business logic (auth, checkout, payment, sweeper, audit)
│   ├── alembic/           DB migrations (independent schema, independent DB)
│   └── tests/             17 pytest tests — all green
│
└── frontend/              React 19 + TypeScript + Vite + Tailwind CSS (port 5173)
    └── src/
        ├── context/       AuthContext (server-side session) + CartContext
        ├── pages/
        │   ├── storefront/ Store, ProductDetail, Cart, Checkout, Payment, Orders
        │   ├── auth/       Login, Register, ForgotPassword, ResetPassword
        │   ├── account/    Profile (avatar upload), Security (change password)
        │   └── admin/      Dashboard, Users, Products, Orders, AuditLogs
        └── components/
            ├── layout/    Navbar, Footer, AdminLayout (sidebar + RBAC guard), CheckoutLayout
            ├── common/    Avatar, CountdownTimer (5-min reservation bar)
            ├── storefront/ ProductCard, ProductFilters
            └── checkout/  CheckoutProgress (Cart → Delivery → Payment)
```

---

## Key Technical Decisions

### Security
| Concern | Implementation |
|---|---|
| Password hashing | Argon2id (via `passlib[argon2]`) |
| Session token | 32-byte `secrets.token_bytes` → SHA-256 hash stored in DB |
| Session cookie | `__Host-task02_session` — HttpOnly, Secure, SameSite=Lax |
| CSRF | In-memory JS token (returned at login) sent via `X-CSRF-Token` header on mutating requests |
| Token storage | **Zero** tokens in `localStorage` / `sessionStorage` |
| Password reset | Single-use, time-limited opaque tokens; anti-enumeration responses |

### Checkout & Inventory
| Concern | Implementation |
|---|---|
| Stock lock | `SELECT … FOR UPDATE` with `.populate_existing()` prevents cached stale reads |
| Concurrency | Parallel checkouts for the same product: exactly one succeeds, rest get 409 |
| Reservation TTL | **5 minutes** (`RESERVATION_TTL_SECONDS=300`), configurable via env |
| Sweeper | Background asyncio daemon runs every 15–30 s, expires stale reservations and restores stock |
| Payment timeout | `MOCK_TIMEOUT` → payment status `TIMEOUT`, order stays `RESERVED` until the 5-min reservation elapses; decoupled from each other |
| Idempotency | `idempotency_records` table with SHA-256 key + payload hash; duplicate `POST /payments/attempt` returns cached response without re-processing |

### Order & Payment State Machines
- **Order Statuses**: `PENDING`, `RESERVED`, `PAID`, `FAILED`, `EXPIRED`, `CANCELLED`.
  - When a paid order is cancelled by an administrator, the order transitions to `CANCELLED` while the associated payment simulates a refund transition to `REFUNDED`.
- **Payment Statuses**: `PENDING`, `SUCCEEDED`, `FAILED`, `TIMEOUT`, `REFUNDED`.
- **Reservation Statuses**: `ACTIVE`, `CONSUMED`, `RELEASED`, `EXPIRED`.

### Audit Trail & Forensic Identity
- **Canonical Database Records**: Immutable, append-only `audit_logs` table. Foreign keys `actor_user_id` and `target_user_id` retain technical UUIDs at all times.
- **Human-Readable Identity Projections**: Eager backend joins resolve current user display name, email, and role for both Actor (who performed the action) and Target (who was affected).
- **Graceful Lifecycle Handling**:
  - Deleted accounts display `"Deleted account"` while retaining technical UUIDs for forensic inspection.
  - Automated worker / background events display `"SYSTEM"` without fabricating human actors.
- **Security Invariant**: Sensitive credentials (passwords, Argon2id hashes, session tokens, CSRF tokens, payment secrets) are strictly prohibited from audit storage and API responses. Audit endpoints enforce strict `ADMIN`-only RBAC.

### Admin Console
- `ADMIN` role inherits **all** `CUSTOMER` shopping capabilities (shop for self, checkout, view own orders). No customer impersonation.
- Self-protection: admin **cannot** deactivate, delete, or demote themselves.
- Last active admin safeguard: cannot remove the only remaining admin.

---

## Running Locally

### Prerequisites
- Python 3.10+ with `pip`
- Node.js 18+ with `npm`
- Docker (for PostgreSQL) — or a native PostgreSQL 16 instance

### 1 — Start the Database

```bash
docker run -d \
  --name task02-postgres \
  -e POSTGRES_DB=task02_ecommerce \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5434:5432 \
  postgres:16
```

> Uses **port 5434** to avoid conflict with Task 01 (port 5433).

### 2 — Backend

```bash
cd task-02/backend

# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux
# Edit .env if needed (defaults point at port 5434)

# Run Alembic migrations
alembic upgrade head

# Start the server (seeds admin + demo data on first startup)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend is available at **http://localhost:8000**  
Interactive docs at **http://localhost:8000/docs**

### 3 — Frontend

```bash
cd task-02/frontend

npm install

# Optional: configure API base URL
cp .env.example .env.local   # or create manually:
# VITE_API_BASE_URL=http://localhost:8000

npm run dev
```

Frontend is available at **http://localhost:5173**

---

## Demo Credentials (seeded on first startup)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@techloom.com` | `AdminSecurePass123!` |
| Customer | `customer@techloom.com` | `CustomerPass123!` |

---

## Mock Payment Toggle

The evaluator payment simulator is a three-way switch available on the Payment page:

| Mode | Behavior |
|---|---|
| `MOCK_SUCCESS` | Payment immediately succeeds; order → `PAID`; reservation → `CONSUMED` |
| `MOCK_FAILURE` | Payment immediately fails; stock released; order → `FAILED` |
| `MOCK_TIMEOUT` | Payment times out; order stays `RESERVED`; reservation expires after 5 min; stock then auto-released by sweeper |

---

## Running Tests

```bash
cd task-02/backend
.venv\Scripts\activate
pytest -v
```

**16 tests, 0 failures:**

| Test | Verifies |
|---|---|
| `test_registration_and_login_flow` | Register, login, session cookie, CSRF token, logout |
| `test_anti_enumeration_forgot_password` | Identical response for known vs unknown email |
| `test_catalog_search_and_filtering` | Category, stock, sort, and pagination |
| `test_cart_operations` | Add, update, remove cart items |
| `test_concurrent_checkout_prevents_overselling` | 10 concurrent threads for 5-unit stock → exactly 5 succeed |
| `test_mock_payment_success_and_idempotency` | Payment succeeds; duplicate key returns cached 200 |
| `test_idempotency_payload_mismatch` | Different payload for same key → 409 |
| `test_mock_payment_failure_restores_stock` | Failed payment releases reservation and restores stock |
| `test_cancel_reserved_order_restores_stock` | Cancel before payment restores stock |
| `test_cancel_paid_order_simulates_refund` | Refund on PAID order triggers mock refund and sets CANCELLED |
| `test_reservation_sweeper_restores_stock` | Sweeper expires stale reservations; stock restored |
| `test_avatar_upload_remove_and_account_deletion` | WebP avatar pipeline; soft-delete anonymisation |
| `test_admin_rbac_and_self_safeguards` | Admin can manage others; cannot deactivate/demote self |
| `test_argon2id_password_hashing` | Argon2id verify and mismatch |
| `test_sha256_token_hashing` | SHA-256 session token hashing |
| `test_decimal_money_precision` | Decimal arithmetic for checkout totals |

---

## Isolation Proof from Task 01

- **Separate PostgreSQL database**: `task02_ecommerce` on port `5434`
- **Separate Alembic migration history**: independent `alembic_version` table, no shared revision chain
- **No imports**: zero `task-01` Python module references anywhere in `task-02/`
- **Separate Python virtualenv**: `task-02/backend/.venv`
- **Separate Node project**: `task-02/frontend/package.json`

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new customer account |
| POST | `/api/v1/auth/login` | Login, set session cookie + return CSRF token |
| POST | `/api/v1/auth/logout` | Invalidate session |
| POST | `/api/v1/auth/forgot-password` | Anti-enumeration password reset request |
| POST | `/api/v1/auth/reset-password` | Consume single-use reset token |

### Catalog
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/products` | Paginated product catalog (public) |
| GET | `/api/v1/products/{slug}` | Product detail by slug (public) |

### Cart
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/cart` | Get active cart |
| POST | `/api/v1/cart/items` | Add item to cart |
| PATCH | `/api/v1/cart/items/{item_id}` | Update item quantity |
| DELETE | `/api/v1/cart/items/{item_id}` | Remove item from cart |

### Checkout & Payment
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/checkout` | Atomically lock stock (5-min reservation) + create order |
| POST | `/api/v1/payments/attempt` | Idempotent payment attempt (MOCK_SUCCESS / MOCK_FAILURE / MOCK_TIMEOUT) |

### Orders
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/orders` | Customer's order history |
| GET | `/api/v1/orders/{id}` | Order detail |
| POST | `/api/v1/orders/{id}/cancel` | Cancel a RESERVED order |

### Profile
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/profile` | Get my profile |
| PATCH | `/api/v1/profile` | Update full name |
| POST | `/api/v1/profile/avatar` | Upload avatar (WebP converted) |
| DELETE | `/api/v1/profile/avatar` | Remove avatar |
| POST | `/api/v1/profile/change-password` | Change password |
| DELETE | `/api/v1/profile/delete-account` | Soft-delete with data anonymisation |

### Admin (ADMIN role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/admin/stats` | KPI dashboard metrics |
| GET | `/api/v1/admin/users` | User directory (search, filter) |
| PATCH | `/api/v1/admin/users/{id}/status` | Activate / suspend user |
| PATCH | `/api/v1/admin/users/{id}/role` | Change user role |
| POST | `/api/v1/admin/users/{id}/reset-password` | Administrative password reset |
| POST | `/api/v1/admin/products` | Create catalog product |
| PATCH | `/api/v1/admin/products/{id}` | Update product / adjust stock |
| GET | `/api/v1/admin/orders` | All orders (paginated, filterable by status) |
| POST | `/api/v1/admin/orders/{id}/refund` | Administrative refund |
| GET | `/api/v1/admin/audit-logs` | Read-only audit log viewer |

---

## Environment Variables (`.env.example`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/task02_ecommerce
SECRET_KEY=change-me-in-production
RESERVATION_TTL_SECONDS=300
SESSION_COOKIE_SECURE=false
CORS_ORIGINS=http://localhost:5173
MEDIA_DIR=./media
```
