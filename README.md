# TechLoom Software Engineer Assessment: POS & E-Commerce Systems

> Two independently implemented commerce systems demonstrating inventory consistency, concurrency-safe checkout, payment lifecycle handling, authentication, authorization, and real-world e-commerce workflows.

[![Live POS System](https://img.shields.io/badge/Task_01_Demo-POS_Order_System-4f46e5?style=for-the-badge&logo=vercel)](https://pos-ecommerce-systems.vercel.app/)
[![Task 01 Backend](https://img.shields.io/badge/Task_01_Backend-Render_API-46e3b7?style=for-the-badge&logo=render)](https://techloom-pos-api.onrender.com/)
[![Live Storefront](https://img.shields.io/badge/Task_02_Demo-E--Commerce_Storefront-059669?style=for-the-badge&logo=vercel)](https://pos-ecommerce-systems-zb3q.vercel.app/)
[![API Backend](https://img.shields.io/badge/Task_02_API-Railway_Production-0284c7?style=for-the-badge&logo=railway)](https://pos-ecommerce-systems-production.up.railway.app/docs)
[![GitHub Repository](https://img.shields.io/badge/GitHub-pos--ecommerce--systems-181717?style=for-the-badge&logo=github)](https://github.com/arudkumaran19/pos-ecommerce-systems.git)

---

## 1. Quick Links & Live Demonstrations

| Task | Component | Hosting Provider | Live URL |
| :--- | :--- | :--- | :--- |
| **Task 01: POS System** | Live Application | Vercel | [pos-ecommerce-systems.vercel.app](https://pos-ecommerce-systems.vercel.app/) |
| **Task 01: POS System** | Backend REST API | Render | [techloom-pos-api.onrender.com](https://techloom-pos-api.onrender.com/) |
| **Task 01: POS System** | Swagger / OpenAPI Docs | Render | [techloom-pos-api.onrender.com/docs](https://techloom-pos-api.onrender.com/docs) |
| **Task 02: E-Commerce Platform** | Live Application | Vercel | [pos-ecommerce-systems-zb3q.vercel.app](https://pos-ecommerce-systems-zb3q.vercel.app/) |
| **Task 02: E-Commerce Platform** | Backend REST API | Railway | [pos-ecommerce-systems-production.up.railway.app](https://pos-ecommerce-systems-production.up.railway.app) |
| **Task 02: E-Commerce Platform** | Swagger / OpenAPI Docs | Railway | [pos-ecommerce-systems-production.up.railway.app/docs](https://pos-ecommerce-systems-production.up.railway.app/docs) |
| **Source Code Repository** | Monorepo Git Repository | GitHub | [github.com/arudkumaran19/pos-ecommerce-systems.git](https://github.com/arudkumaran19/pos-ecommerce-systems.git) |

---

## 2. Demo Credentials

### Task 01 · POS System

| Role | Email | Password |
|---|---|---|
| Cashier | `cashier@techloom.com` | `CashierPass123!` |
| Manager | `manager@techloom.com` | `ManagerPass123!` |

### Task 02 · E-Commerce Storefront

| Role | Email | Password |
|---|---|---|
| Customer | `customer@techloom.com` | `CustomerPass123!` |
| Admin | `admin@techloom.com` | `AdminSecurePass123!` |

---

## Table of Contents

1. [Quick Links & Live Demonstrations](#1-quick-links--live-demonstrations)
2. [Demo Credentials](#2-demo-credentials)
2. [Executive Summary & Architectural Independence](#2-executive-summary--architectural-independence)
3. [Assessment Requirements Overview](#3-assessment-requirements-overview)
4. [Repository Structure](#4-repository-structure)
5. [Task 01: POS Order & Inventory System](#5-task-01-pos-order--inventory-system)
   - [Objective & Core Features](#task-01-objective--core-features)
   - [System Architecture](#task-01-system-architecture)
   - [Checkout Sequence Flow](#task-01-checkout-sequence-flow)
   - [High-Concurrency Lock Ordering & Race Prevention](#task-01-concurrency-protection)
   - [Reservation State Machine](#task-01-reservation-state-machine)
   - [Payment Processing Flow](#task-01-payment-flow)
   - [Database Schema & ER Diagram](#task-01-database-schema)
   - [API Surface Reference](#task-01-api-surface)
6. [Task 02: Enterprise E-Commerce Platform](#6-task-02-enterprise-e-commerce-platform)
   - [Objective & Customer Journey](#task-02-objective--customer-journey)
   - [Admin Back-Office Application Shell](#task-02-admin-console)
   - [System Architecture](#task-02-system-architecture)
   - [Database Schema & ER Diagram](#task-02-database-schema)
   - [Checkout Sequence Flow](#task-02-checkout-sequence)
   - [Reservation State Machine](#task-02-reservation-lifecycle)
   - [Payment State Machine & Transitions](#task-02-payment-state-machine)
   - [Distributed Idempotency Protection](#task-02-idempotency-protection)
   - [Authentication & Cryptography Architecture](#task-02-authentication-architecture)
   - [Password Reset Workflow via Resend API](#task-02-password-reset-flow)
   - [Role-Based Access Control & Safeguards](#task-02-admin-rbac-and-safeguards)
   - [Order Cancellation & Refund Workflow](#task-02-cancellation-and-refund-workflow)
   - [Audit Logging Architecture](#task-02-audit-logging-architecture)
   - [API Surface Reference](#task-02-api-surface)
7. [Production Deployment Architecture](#7-production-deployment-architecture)
8. [Technology Stack Comparison](#8-technology-stack-comparison)
9. [Feature Comparison Matrix](#9-feature-comparison-matrix)
10. [Assessment Requirement Traceability Matrix](#10-assessment-requirement-traceability-matrix)
11. [Testing & Quality Verification](#11-testing--quality-verification)
12. [Engineering Quality Pillars](#12-engineering-quality-pillars)
13. [UI/UX Design Philosophy & Journeys](#13-uiux-design-philosophy--journeys)
14. [Local Development & Environment Setup](#14-local-development--environment-setup)
15. [Environment Variables Reference](#15-environment-variables-reference)
16. [Responsive Design & Viewport QA Matrix](#16-responsive-design--viewport-qa-matrix)
17. [Security Implementation Matrix](#17-security-implementation-matrix)
18. [State Machine Comparative Analysis](#18-state-machine-comparative-analysis)
19. [Architectural Decisions & Technical Rationales](#19-architectural-decisions--technical-rationales)
20. [Known Limitations & Design Boundaries](#20-known-limitations--design-boundaries)
21. [Final Verification & Submission Report](#21-final-verification--submission-report)

---

## 2. Executive Summary & Architectural Independence

This repository contains two independently realized commerce systems designed to fulfill the **TechLoom Software Engineer Intern Practical Assessment**:

- **Task 01 (`/task-01`):** A physical Point of Sale (POS) Order & Inventory System built for cashier checkout lanes. It focuses on low-latency terminal interactions, integer surrogate keys, integer-ordered row-level locking (`SELECT ... FOR UPDATE`), server-side sessions with bcrypt, 5-minute inventory reservation windows, and an automated background expiry service running every 5 seconds.
- **Task 02 (`/task-02`):** A full-featured enterprise E-Commerce Platform built for public internet commerce. It features UUIDv4 primary keys, Argon2id password hashing, CSRF synchronizer tokens, transactional stock reservations with an asynchronous sweeper running every 15 seconds with `SKIP LOCKED`, distributed payment idempotency keys, structured JSONB audit logging, Resend transactional email integration, and a dual-surface UI (public boutique storefront + fixed application shell admin console).

### Strict Architectural Isolation

The two tasks share zero database tables, zero backend code, zero models, and zero runtime dependencies. Each task has its own virtual environment, database schema, migrations, and deployment configuration:

```mermaid
graph TB
    subgraph Monorepo ["Repository Root: techloom-software-engineer-assessment"]
        subgraph Task01 ["task-01: POS Order & Inventory System"]
            T1_FE["React 19 + Vite 8 + Tailwind v4<br/>(POS Cashier Interface)"]
            T1_BE["FastAPI + SQLAlchemy 2.0<br/>(Integer PKs + Row Locks)"]
            T1_DB["Render PostgreSQL 16<br/>Database: techloom_pos"]
            T1_Worker["Asyncio Expiry Worker<br/>(Runs every 5s)"]
            
            T1_FE -->|REST + HttpOnly Cookies| T1_BE
            T1_BE -->|psycopg3| T1_DB
            T1_Worker -->|FOR UPDATE SKIP LOCKED| T1_DB
        end

        subgraph Task02 ["task-02: Enterprise E-Commerce Platform"]
            T2_FE["React 19 + Vite 8 + Tailwind v3<br/>(Storefront + Admin App Shell)"]
            T2_BE["FastAPI + SQLAlchemy 2.0<br/>(UUIDv4 PKs + Argon2id + CSRF)"]
            T2_DB["Railway PostgreSQL<br/>Database: task02_ecommerce"]
            T2_Sweeper["Asyncio Sweeper Task<br/>(Runs every 15s)"]
            T2_Resend["Resend API<br/>(Password Reset Dispatch)"]
            
            T2_FE -->|REST + HttpOnly + CSRF Headers| T2_BE
            T2_BE -->|psycopg2-binary| T2_DB
            T2_BE -->|HTTPS REST| T2_Resend
            T2_Sweeper -->|FOR UPDATE SKIP LOCKED| T2_DB
        end
    end

    classDef t1 fill:#eef2ff,stroke:#6366f1,stroke-width:1px;
    classDef t2 fill:#ecfdf5,stroke:#10b981,stroke-width:1px;
    class T1_FE,T1_BE,T1_DB,T1_Worker t1;
    class T2_FE,T2_BE,T2_DB,T2_Sweeper,T2_Resend t2;
```

---

## 3. Assessment Requirements Overview

| Assessment Category | Task 01: POS Order & Inventory System | Task 02: E-Commerce Platform |
| :--- | :--- | :--- |
| **Catalog & Products** | Product CRUD, price, available stock, active flag | Catalog browsing, category filtering, search, slug lookup |
| **Stock Visibility** | Real-time stock counters on POS register | Live available stock indicators, out-of-stock badges |
| **Cart Operations** | Cashier cart creation, item addition, quantity updates | Customer persistent cart, item updates, stock cap checks |
| **Inventory Protection** | Pessimistic `SELECT ... FOR UPDATE` row locks | Deterministic ID-sorted `FOR UPDATE` row locks |
| **Stock Reservation** | 5-minute TTL reservation created at checkout | 5-minute (300s) TTL reservation created at checkout |
| **Expiry Sweeper** | Background loop running every 5 seconds | Background loop running every 15s with `SKIP LOCKED` |
| **Stock Restoration** | Expired reservations release stock back to catalog | Sweeper restores stock and marks order `EXPIRED` |
| **Payment Simulation** | Success, Failure, and Timeout simulation outcomes | Success, Failure, and Timeout simulation outcomes |
| **Duplicate Protection** | Unique `idempotency_key` per payment record | `IdempotencyRecord` table caching request hash & response |
| **Order Cancellation** | Order cancellation restores reserved stock | Admin cancellation releases reservation / simulates refund |
| **Security & Auth** | Server-side sessions, bcrypt hashing, RBAC | Argon2id hashing, CSRF headers, session tokens, RBAC |
| **Deployment** | Vercel Frontend + Render Backend + Render PostgreSQL | Vercel Frontend + Railway Backend + Railway PostgreSQL |

---

## 4. Repository Structure

```
techloom-software-engineer-assessment/
├── README.md                            # Comprehensive Root Documentation (This File)
├── task-01/                             # Task 01: POS Order & Inventory System
│   ├── app/
│   │   ├── api/                         # FastAPI Route Handlers (auth, cart, checkout, etc.)
│   │   ├── core/                        # Database Engine, Session & Security Utilities
│   │   ├── models/                      # SQLAlchemy Integer PK Models (Product, Order, etc.)
│   │   ├── schemas/                     # Pydantic Request/Response Data Contracts
│   │   └── services/                    # Checkout, Inventory & 5s Expiry Worker
│   ├── frontend/
│   │   ├── src/                         # React 19 + Tailwind v4 Single-Page Terminal
│   │   │   ├── components/              # Cashier, Inventory, History & User Views
│   │   │   ├── App.tsx                  # Main POS Application Router & State Container
│   │   │   └── main.tsx                 # Entry Point
│   │   ├── package.json                 # React 19, Vite 8, Tailwind v4
│   │   └── vite.config.ts
│   ├── tests/                           # 7 Pytest Integration Test Modules
│   ├── docker-compose.yml               # Local PostgreSQL 16 Service Definition
│   ├── requirements.txt                 # Backend Dependencies (FastAPI, SQLAlchemy, bcrypt)
│   └── pytest.ini
│
└── task-02/                             # Task 02: Enterprise E-Commerce Platform
    ├── backend/
    │   ├── alembic/                     # Database Schema Migrations
    │   ├── app/
    │   │   ├── api/
    │   │   │   ├── admin/               # Admin Endpoints (audit_logs, orders, products, users)
    │   │   │   ├── storefront/          # Storefront Endpoints (auth, cart, checkout, payments)
    │   │   │   └── router.py            # Central Aggregator Router
    │   │   ├── core/                    # Argon2id, Config, Session Manager & DB Engine
    │   │   ├── models/                  # UUIDv4 Models (User, Product, Order, AuditLog, etc.)
    │   │   ├── schemas/                 # Strict Pydantic Data Contracts
    │   │   └── services/                # Sweeper Service (15s), Checkout & Resend Client
    │   ├── tests/                       # 21 Passing Pytest Integration Tests
    │   ├── requirements.txt             # Backend Dependencies (argon2-cffi, Resend, etc.)
    │   └── .env.example                 # Environment Variable Template
    └── frontend/
        ├── src/
        │   ├── components/              # Navigation, Modals & UI Atoms
        │   ├── layouts/                 # AdminLayout (Fixed Shell) & CheckoutLayout
        │   ├── pages/                   # Storefront, Checkout, Orders & Admin Pages
        │   ├── services/                # Axios API Client with CSRF Interceptors
        │   └── types/                   # TypeScript Interfaces & Enums
        ├── package.json                 # React 19, Vite 8, Tailwind v3, React Router v7
        └── vite.config.ts
```

---

## 5. Task 01: POS Order & Inventory System

### Task 01: Objective & Core Features
Engineered specifically for physical store checkout registers, the POS system coordinates fast transaction completion while ensuring inventory integrity:
- **Product Management:** Cashiers and managers review available catalog items; managers can create and adjust products with price and stock validation.
- **Cart Management:** Dynamic active carts allow fast addition, quantity adjustments, and removals.
- **Stock Reservation:** Converting a cart to an order locks stock atomically and issues a 5-minute reservation.
- **Automated Expiry Worker:** An asynchronous worker evaluates reservations every 5 seconds, releasing uncompleted transactions.
- **Payment Processing:** Payment tender endpoint supports mock outcomes (`SUCCESS`, `FAILURE`, `TIMEOUT`) guarded by unique idempotency keys.
- **Role-Based Access Control:** Separate roles for `cashier` (sales register, history) and `manager` (inventory editing, user management).

### Task 01: System Architecture

```mermaid
graph TD
    Client["POS Cashier Terminal<br/>(React 19 + Vite 8 + Tailwind v4)"]
    API["FastAPI Backend Server<br/>(Port 8000)"]
    
    subgraph CoreServices ["Application Service Layer"]
        AuthSvc["Auth & Session Manager<br/>(bcrypt rounds=12)"]
        CartSvc["Cart Service<br/>(Active Cart & Items)"]
        CheckoutSvc["Checkout Service<br/>(Pessimistic Row Locking)"]
        PaymentSvc["Payment Service<br/>(Idempotency Validation)"]
        ExpirySvc["Reservation Expiry Worker<br/>(Runs every 5s)"]
    end
    
    DB["PostgreSQL 16<br/>techloom_pos"]

    Client -->|REST + HttpOnly Cookies| API
    API --> AuthSvc
    API --> CartSvc
    API --> CheckoutSvc
    API --> PaymentSvc
    CheckoutSvc -->|SELECT FOR UPDATE| DB
    ExpirySvc -->|FOR UPDATE SKIP LOCKED| DB
    PaymentSvc --> DB
```

### Task 01: Checkout Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Cashier
    participant POS as POS Frontend
    participant API as FastAPI Backend
    participant DB as PostgreSQL 16
    participant Expiry as Expiry Worker (5s)

    Cashier->>POS: Review Cart & Click Checkout
    POS->>API: POST /api/checkout {cart_id}
    Note over API,DB: Transaction Begins
    API->>DB: SELECT * FROM carts WHERE id = :cart_id FOR UPDATE
    API->>DB: SELECT * FROM products WHERE id IN (:ids) ORDER BY id ASC FOR UPDATE
    API->>DB: Verify available_stock >= requested quantity for each item
    API->>DB: UPDATE products SET available_stock = available_stock - qty
    API->>DB: INSERT INTO orders (status='Reserved', cart_id, user_id)
    API->>DB: INSERT INTO order_items (order_id, product_id, price, quantity)
    API->>DB: INSERT INTO reservations (order_id, expires_at=NOW()+300s, status='Active')
    API->>DB: UPDATE carts SET status = 'CheckedOut'
    Note over API,DB: Transaction Committed
    API-->>POS: 201 Created {order_id, reservation_id, expires_at}

    alt Payment Succeeded within 5 mins
        Cashier->>POS: Tender Payment
        POS->>API: POST /api/payments {order_id, idempotency_key, outcome='SUCCESS'}
        API->>DB: Verify idempotency_key uniqueness
        API->>DB: UPDATE orders SET status = 'Paid', completed_at = NOW()
        API->>DB: UPDATE reservations SET status = 'Consumed'
        API-->>POS: 200 OK (Payment Recorded)
    else Reservation Window Expires (>5 mins)
        Expiry->>DB: SELECT * FROM reservations WHERE expires_at <= NOW AND status = 'Active' FOR UPDATE SKIP LOCKED
        Expiry->>DB: Lock affected products ORDER BY id ASC
        Expiry->>DB: UPDATE products SET available_stock = available_stock + qty
        Expiry->>DB: UPDATE reservations SET status = 'Expired'
        Expiry->>DB: UPDATE orders SET status = 'Expired'
    end
```

### Task 01: Concurrency Protection

To prevent race conditions and inventory overselling when two cashier stations attempt to check out the last remaining stock item simultaneously, Task 01 uses strict database-level row locking with deterministic ID ordering:

```mermaid
flowchart TD
    TerminalA["Cashier Station A<br/>Checkout Product #10 (Qty: 1)"]
    TerminalB["Cashier Station B<br/>Checkout Product #10 (Qty: 1)"]

    subgraph DatabaseEngine ["PostgreSQL Concurrency Control"]
        LockQueue["Product #10 Row Lock Queue<br/>(Available Stock: 1)"]
        AcquireA["Station A Acquires Lock<br/>SELECT FOR UPDATE"]
        CheckStockA{"Stock >= 1?"}
        DeductA["Stock: 1 - 1 = 0<br/>Commit Order A<br/>Release Lock"]
        
        AcquireB["Station B Acquires Lock<br/>(Blocked until Station A Commits)"]
        CheckStockB{"Stock >= 1?"}
        RejectB["Stock = 0<br/>Rollback Transaction<br/>Raise HTTP 409 Conflict"]
    end

    TerminalA --> AcquireA
    TerminalB --> LockQueue
    AcquireA --> CheckStockA
    CheckStockA -- Yes --> DeductA
    DeductA --> AcquireB
    AcquireB --> CheckStockB
    CheckStockB -- No --> RejectB
    DeductA -.-> SuccessA["Station A: 201 Created (Reserved)"]
    RejectB -.-> ErrorB["Station B: 409 Out of Stock"]
```

### Task 01: Reservation State Machine

```mermaid
stateDiagram-v2
    [*] --> Active: Checkout Initiated (5-min TTL)
    Active --> Consumed: Payment Succeeded (Stock permanently deducted)
    Active --> Released: Order Cancelled by Cashier (Stock restored)
    Active --> Expired: Expiry Worker Sweeps (>5 mins elapsed, Stock restored)
    Consumed --> [*]
    Released --> [*]
    Expired --> [*]
```

### Task 01: Payment Flow

```mermaid
flowchart TD
    PayAttempt["Payment Initiated<br/>POST /api/payments"] --> ValidateTTL{"Is Reservation Active & Unexpired?"}
    ValidateTTL -- No (Expired) --> ExpireFail["Release Reservation & Stock<br/>Return HTTP 409 Conflict"]
    ValidateTTL -- Yes --> CheckIdemp{"Is Idempotency Key Seen?"}
    CheckIdemp -- Seen on Same Order --> ReturnCached["Return Cached Payment Result"]
    CheckIdemp -- Seen on Different Order --> RejectIdemp["HTTP 422 Unprocessable Entity"]
    CheckIdemp -- New Key --> ExecuteSim{"Simulate Outcome"}
    ExecuteSim -- SUCCESS --> Succeeded["Order -> Paid<br/>Reservation -> Consumed<br/>Payment -> Succeeded"]
    ExecuteSim -- FAILURE --> Failed["Order -> Failed<br/>Reservation -> Released (Stock Restored)<br/>Payment -> Failed"]
    ExecuteSim -- TIMEOUT --> TimedOut["Order -> Expired<br/>Reservation -> Expired (Stock Restored)<br/>Payment -> TimedOut"]
```

### Task 01: Database Schema

```mermaid
erDiagram
    USERS ||--o{ USER_SESSIONS : maintains
    USERS ||--o{ ORDERS : cashier_attribution
    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : referenced_in
    CARTS ||--o| ORDERS : converts_to
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : snapshotted_as
    ORDERS ||--o| RESERVATIONS : generates
    ORDERS ||--o| PAYMENTS : settled_by

    USERS {
        int id PK
        string email "UNIQUE"
        string hashed_password "bcrypt"
        string display_name
        string role "cashier | manager"
        boolean is_active
        timestamp created_at
    }

    USER_SESSIONS {
        int id PK
        int user_id FK
        string token_hash "SHA-256"
        timestamp expires_at
        timestamp revoked_at
    }

    PRODUCTS {
        int id PK
        string name
        numeric price "Numeric(12,2)"
        int available_stock "CHECK >= 0"
        boolean is_active
    }

    CARTS {
        int id PK
        string status "Active | CheckedOut"
    }

    CART_ITEMS {
        int id PK
        int cart_id FK
        int product_id FK
        int quantity "CHECK > 0"
    }

    ORDERS {
        int id PK
        int cart_id FK "UNIQUE"
        int user_id FK "Nullable"
        string status "Pending | Reserved | Paid | Cancelled | Expired | Failed"
        timestamp created_at
        timestamp completed_at
    }

    ORDER_ITEMS {
        int id PK
        int order_id FK
        int product_id FK
        string product_name
        numeric unit_price
        int quantity
    }

    RESERVATIONS {
        int id PK
        int order_id FK "UNIQUE"
        string status "Active | Released | Expired | Consumed"
        timestamp expires_at
        timestamp released_at
    }

    PAYMENTS {
        int id PK
        int order_id FK "UNIQUE"
        string idempotency_key "UNIQUE"
        string status "Pending | Succeeded | Failed | TimedOut | Refunded"
        timestamp processed_at
    }
```

### Task 01: API Surface Reference

| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Validates credentials and sets session cookie |
| `POST` | `/api/auth/logout` | Authenticated | Revokes current session |
| `GET` | `/api/auth/me` | Authenticated | Returns current authenticated user profile |
| `GET` | `/api/products` | Cashier, Manager | Returns active catalog with stock levels |
| `POST` | `/api/products` | Manager | Creates new product with stock validation |
| `POST` | `/api/cart` | Cashier | Initializes active checkout cart |
| `POST` | `/api/cart/items` | Cashier | Adds product item to cart |
| `DELETE` | `/api/cart/items/{id}` | Cashier | Removes product item from cart |
| `POST` | `/api/checkout` | Cashier | Concurrency-locked stock reservation |
| `POST` | `/api/payments` | Cashier | Idempotent payment processing with TTL check |
| `GET` | `/api/orders` | Cashier, Manager | Retrieves chronological order history |
| `GET` | `/api/orders/{id}` | Cashier, Manager | Retrieves detailed order items and payment status |

---

## 6. Task 02: Enterprise E-Commerce Platform

### Task 02: Objective & Customer Journey
Designed as an online retail boutique and administrative system:
- **Product Discovery:** Search by query, filter by category and price range, inspect product details and live stock counts.
- **Cart & Line Items:** Persistent customer carts with subtotal recalculations and available stock caps.
- **Checkout & Delivery:** Address entry with JSONB storage and deterministic locked stock reservations (300s TTL).
- **Payment & Idempotency:** Payment simulation with idempotency key protection preventing duplicate financial transactions.
- **Customer Account:** Order history with receipts, personal profile editing, avatar uploads, and password change.
- **Self-Service Recovery:** Single-use password reset links dispatched via Resend transactional email.

### Task 02: Admin Console & Application Shell
The administrative interface operates as an application shell with a fixed 240px navigation sidebar and dedicated scrollable views:
- **Dashboard:** Platform summary with live Gross Merchandise Volume (GMV), active customer count, order distribution, and inventory alerts.
- **User Management:** Paginated user directory with role promotion/demotion and safeguard protections.
- **Product Inventory:** Full catalog overview with inline stock adjustments, pricing edits, and product creation.
- **Order Processing:** Filter orders by status, inspect itemized line items, and process simulated refunds and cancellations.
- **Audit Logging:** Searchable, immutable event trail recording user actions with structured JSONB diffs (`before_data` / `after_data`).
- *Note on Admin Identity:* Administrators use their own single account to shop the storefront and manage the admin console; administrators do not impersonate customer accounts.

### Task 02: System Architecture

```mermaid
graph TD
    Browser["Client Web Browser<br/>(React 19 + TypeScript + Tailwind v3)"]
    
    subgraph Routing ["React Router v7 Navigation"]
        StoreRoutes["Customer Storefront Routes<br/>(/, /products, /cart, /checkout, /orders)"]
        AdminShell["Admin Application Shell<br/>(/admin, /admin/users, /admin/products, /admin/audit-logs)"]
    end

    API["FastAPI Backend Server<br/>(Port 8001 / Railway PaaS)"]

    subgraph BackendLayers ["FastAPI Layered Architecture"]
        Router["Central Aggregator Router<br/>(app/api/router.py)"]
        StoreAPIs["Storefront Routers<br/>(auth, cart, checkout, payments, profile)"]
        AdminAPIs["Admin Routers<br/>(stats, users, products, orders, audit_logs)"]
        
        subgraph Services ["Domain Services Layer"]
            AuthService["Argon2id Auth & Session Manager"]
            CheckoutService["Checkout & Concurrency Lock Service"]
            PaymentService["Payment & Idempotency Service"]
            SweeperService["Periodic Sweeper Task (15s Loop)"]
            AuditService["Immutable JSONB Audit Service"]
            ResendService["Resend Email Dispatch Client"]
        end
        
        Alembic["Alembic Database Migrations"]
    end

    Postgres["Railway PostgreSQL Engine<br/>Database: task02_ecommerce"]
    ResendCloud["Resend Transactional Email API"]

    Browser --> Routing
    Routing -->|REST API Requests + CSRF Header| API
    API --> Router
    Router --> StoreAPIs
    Router --> AdminAPIs
    StoreAPIs --> Services
    AdminAPIs --> Services
    Services -->|psycopg2-binary| Postgres
    SweeperService -->|SELECT FOR UPDATE SKIP LOCKED| Postgres
    ResendService -->|HTTPS API| ResendCloud
```

### Task 02: Database Schema (Enterprise Entity-Relationship)

```mermaid
erDiagram
    USERS ||--o{ USER_SESSIONS : maintains
    USERS ||--o{ PASSWORD_RESET_TOKENS : requests
    USERS ||--o{ CARTS : owns
    USERS ||--o{ ORDERS : places
    USERS ||--o{ IDEMPOTENCY_RECORDS : generates
    USERS ||--o{ AUDIT_LOGS : triggers

    CARTS ||--o{ CART_ITEMS : contains
    PRODUCTS ||--o{ CART_ITEMS : references
    ORDERS ||--o{ ORDER_ITEMS : contains
    PRODUCTS ||--o{ ORDER_ITEMS : snapshotted_in
    ORDERS ||--o{ RESERVATIONS : holds
    PRODUCTS ||--o{ RESERVATIONS : reserves
    ORDERS ||--o| PAYMENTS : settled_by
    IDEMPOTENCY_RECORDS ||--o| PAYMENTS : guarantees

    USERS {
        uuid id PK
        string email "UNIQUE"
        string full_name
        string password_hash "Argon2id"
        string role "CUSTOMER | ADMIN"
        string avatar_url
        boolean is_active
        timestamp deleted_at "Soft delete"
        timestamp created_at
        timestamp updated_at
    }

    USER_SESSIONS {
        uuid id PK
        uuid user_id FK
        string session_token_hash "SHA-256"
        string csrf_token
        string ip_address
        string user_agent
        timestamp expires_at
        timestamp last_active_at
    }

    PASSWORD_RESET_TOKENS {
        string token_hash PK
        uuid user_id FK
        timestamp expires_at
        timestamp used_at
    }

    PRODUCTS {
        uuid id PK
        string name
        string slug "UNIQUE"
        string description
        string category
        numeric price "Numeric(12,2)"
        int available_stock "CHECK >= 0"
        string image_url
        boolean is_active
        timestamp created_at
    }

    CARTS {
        uuid id PK
        uuid user_id FK
        string status "ACTIVE | CONVERTED | ABANDONED"
        timestamp updated_at
    }

    CART_ITEMS {
        uuid id PK
        uuid cart_id FK
        uuid product_id FK
        int quantity "CHECK > 0"
        numeric unit_price
        numeric subtotal
    }

    ORDERS {
        uuid id PK
        uuid user_id FK
        uuid cart_id FK "Nullable"
        string status "PENDING | RESERVED | PAID | FAILED | EXPIRED | CANCELLED"
        numeric subtotal
        numeric shipping_fee
        numeric total
        jsonb shipping_address
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        string product_name
        numeric unit_price
        int quantity
        numeric subtotal
    }

    RESERVATIONS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        string status "ACTIVE | CONSUMED | RELEASED | EXPIRED"
        timestamp expires_at
        timestamp released_at
    }

    IDEMPOTENCY_RECORDS {
        string key PK
        uuid user_id FK
        string endpoint
        string request_hash "SHA-256"
        string status "IN_PROGRESS | COMPLETED"
        int response_code
        jsonb response_body
        timestamp expires_at
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK "UNIQUE"
        string idempotency_key FK
        string status "PENDING | SUCCEEDED | FAILED | TIMEOUT | REFUNDED"
        numeric amount
        string provider
        string provider_reference
        string error_message
        timestamp created_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_user_id FK "Nullable"
        uuid target_user_id FK "Nullable"
        string action
        string entity_type
        string entity_id
        jsonb before_data
        jsonb after_data
        string reason
        string ip_address
        string user_agent
        timestamp created_at
    }
```

### Task 02: Checkout Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as React Storefront
    participant API as FastAPI Backend
    participant DB as PostgreSQL (Railway)
    participant Sweeper as Background Sweeper (15s)

    Customer->>UI: Reviews Cart & Enters Shipping Address
    Customer->>UI: Clicks "Complete Checkout"
    UI->>API: POST /api/storefront/checkout {shipping_address, idempotency_key}
    Note over API,DB: Transaction Begins
    API->>DB: Lock Cart (FOR UPDATE)
    API->>DB: Lock Products in ascending UUID order (FOR UPDATE)
    API->>DB: Verify stock >= quantity for all cart items
    API->>DB: Decrement available_stock for each product
    API->>DB: Insert Order (Status: RESERVED)
    API->>DB: Insert Line Items & Reservations (TTL: 300 Seconds)
    API->>DB: Record IdempotencyRecord (status: IN_PROGRESS)
    Note over API,DB: Transaction Committed
    API-->>UI: 201 Created {order_id, reservation_ttl: 300}

    Customer->>UI: Enters Payment Details & Authorizes
    UI->>API: POST /api/storefront/payments {order_id, idempotency_key, outcome}
    API->>DB: Check IdempotencyRecord (Prevent duplicate execution)
    alt Payment Succeeded
        API->>DB: Update Payment -> SUCCEEDED
        API->>DB: Update Order -> PAID
        API->>DB: Update Reservation -> CONSUMED
        API-->>UI: 200 OK (Payment Confirmed)
    else Payment Timeout or Expiry
        Sweeper->>DB: SELECT * FROM reservations WHERE expires_at <= NOW AND status='ACTIVE' FOR UPDATE SKIP LOCKED
        Sweeper->>DB: Lock products in sorted order
        Sweeper->>DB: Restore available_stock += quantity
        Sweeper->>DB: Update Reservation -> EXPIRED, Order -> EXPIRED
    end
```

### Task 02: Reservation Lifecycle

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Checkout Executed (300s TTL)
    ACTIVE --> CONSUMED: Payment Succeeded (Inventory captured permanently)
    ACTIVE --> RELEASED: Customer / Admin Order Cancellation (Inventory restored)
    ACTIVE --> EXPIRED: 15s Sweeper Finds expires_at <= NOW (Inventory restored)
    CONSUMED --> [*]
    RELEASED --> [*]
    EXPIRED --> [*]
```

### Task 02: Payment State Machine

```mermaid
stateDiagram-v2
    [*] --> PENDING: Payment Initiated
    PENDING --> SUCCEEDED: Gateway Simulation Succeeds
    PENDING --> FAILED: Card Declined / Insufficient Funds
    PENDING --> TIMEOUT: Gateway Network Timeout
    SUCCEEDED --> REFUNDED: Admin Issues Refund
    FAILED --> [*]
    TIMEOUT --> [*]
    REFUNDED --> [*]
```

### Task 02: Idempotency Protection

```mermaid
sequenceDiagram
    autonumber
    actor Client as Customer Browser
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Client->>API: POST /api/storefront/payments (Header: X-Idempotency-Key: uuid-123)
    API->>DB: SELECT * FROM idempotency_records WHERE key = 'uuid-123'
    alt Key Not Found
        API->>DB: INSERT INTO idempotency_records (key='uuid-123', request_hash=sha256(body), status='IN_PROGRESS')
        API->>API: Execute Payment Logic & Commit
        API->>DB: UPDATE idempotency_records SET status='COMPLETED', response_code=200, response_body=json
        API-->>Client: 200 OK (Fresh Payment Result)
    else Key Exists with IDENTICAL Request Payload
        DB-->>API: Returns completed record
        API-->>Client: 200 OK (Replayed Cached Response, No Re-charge)
    else Key Exists with DIFFERENT Request Payload
        DB-->>API: Returns completed record with mismatching request_hash
        API-->>Client: 422 Unprocessable Entity (Payload Mismatch Error)
    end
```

### Task 02: Authentication Architecture

```mermaid
flowchart TD
    User([Customer or Admin]) --> LoginReq[POST /api/storefront/auth/login<br/>email + password]
    LoginReq --> FetchUser[Lookup user by email]
    FetchUser --> VerifyArgon[Verify password with Argon2id RFC 9106]
    VerifyArgon -- Failure --> Reject401[HTTP 401 Invalid Credentials]
    VerifyArgon -- Success --> GenerateTokens[Generate Cryptographic Session Token & CSRF Token]
    GenerateTokens --> HashToken[Compute SHA-256 Digest of Session Token]
    HashToken --> StoreSession[Insert into user_sessions table]
    StoreSession --> SetCookies[Set HttpOnly Cookie: techloom_session<br/>Return CSRF Token in Response Body]
    SetCookies --> AuthenticatedState[Authenticated Session Ready]
    
    subgraph MutatingRequests ["Subsequent State-Mutating Requests (POST, PATCH, DELETE)"]
        Req[Incoming Mutating Request] --> CheckCookie{Valid Session Cookie?}
        CheckCookie -- No --> Err401[HTTP 401 Unauthorized]
        CheckCookie -- Yes --> CheckCSRF{Matches X-CSRF-Token Header?}
        CheckCSRF -- No --> Err403[HTTP 403 Forbidden: CSRF Token Invalid]
        CheckCSRF -- Yes --> Allow[Execute Handler]
    end
```

### Task 02: Password Reset Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Account Owner
    participant Web as Web Frontend
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant Resend as Resend Email Gateway

    User->>Web: Clicks "Forgot Password" & Submits Email
    Web->>API: POST /api/storefront/auth/forgot-password {email}
    API->>DB: Verify user exists and is active
    API->>DB: Generate secure random token & store SHA-256 hash (TTL: 15 mins)
    API->>Resend: Dispatch transactional email with reset link
    Resend-->>User: Delivers email with secure link: /reset-password?token=xxx
    API-->>Web: 200 OK (Generic success message prevents user enumeration)

    User->>Web: Opens link & submits new password
    Web->>API: POST /api/storefront/auth/reset-password {token, new_password}
    API->>DB: Query password_reset_tokens where token_hash matches, unexpired, unused
    API->>DB: Update user password_hash = Argon2id(new_password)
    API->>DB: Mark reset token as used (used_at = NOW())
    API->>DB: Revoke all existing user sessions (forces re-login across all devices)
    API-->>Web: 200 OK (Password Reset Successful)
```

### Task 02: Admin RBAC and Safeguards

```mermaid
flowchart TD
    UserRole{"User Role"}
    UserRole -- CUSTOMER --> Storefront["Storefront Catalog<br/>Cart Management<br/>Checkout & Payment<br/>Personal Order History<br/>Profile & Avatar"]
    UserRole -- ADMIN --> FullAccess["Full Customer Privileges<br/>(Admin shops with their own account)"]
    FullAccess --> AdminDashboard["Admin Dashboard & Revenue KPIs"]
    FullAccess --> AdminUsers["User Management & Role Assignment"]
    FullAccess --> AdminProducts["Product Management & Stock Updates"]
    FullAccess --> AdminOrders["Order Management & Refund Simulations"]
    FullAccess --> AdminAudit["Append-Only JSONB Audit Trail"]

    subgraph Safeguards ["Enforced Administrator Safeguards"]
        S1["Cannot delete self"]
        S2["Cannot demote self"]
        S3["Cannot deactivate self"]
        S4["Final remaining active admin cannot be removed"]
        S5["All administrative actions generate immutable audit logs"]
    end

    AdminUsers -.-> Safeguards
```

### Task 02: Cancellation and Refund Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Admin
    participant UI as Admin Portal
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Admin->>UI: Selects Order and clicks "Cancel & Refund"
    UI->>API: POST /api/admin/orders/{id}/cancel {reason: "Customer Requested"}
    Note over API,DB: Transaction Begins
    API->>DB: Lock Order and associated Payment (FOR UPDATE)
    API->>DB: Validate order is in refundable state (PAID or RESERVED)
    alt Order was PAID
        API->>DB: Update Payment status = REFUNDED
        API->>DB: Restore product available_stock += quantity
        API->>DB: Update Order status = CANCELLED
    else Order was RESERVED
        API->>DB: Update Reservation status = RELEASED
        API->>DB: Restore product available_stock += quantity
        API->>DB: Update Order status = CANCELLED
    end
    API->>DB: Insert AuditLog (action='ORDER_CANCELLED', before/after JSONB diff)
    Note over API,DB: Transaction Committed
    API-->>UI: 200 OK {status: "CANCELLED", refund_processed: true}
```

### Task 02: Audit Logging Architecture

```mermaid
flowchart LR
    Actor[Authenticated Admin] --> Action[Executes Action<br/>Update Stock / Change Role]
    Action --> AuditService[Audit Log Service]
    AuditService --> Record[Immutable Audit Record]
    
    subgraph AuditPayload ["Structured Audit Attributes"]
        direction TB
        A1["actor_user_id (UUID)"]
        A2["action (e.g., USER_ROLE_UPDATED)"]
        A3["entity_type & entity_id"]
        A4["before_data (JSONB Snapshot)"]
        A5["after_data (JSONB Snapshot)"]
        A6["ip_address & user_agent"]
        A7["created_at (Timestamp)"]
    end
    
    Record --> AuditPayload
    AuditPayload --> DB["PostgreSQL Table: audit_logs"]
```

### Task 02: API Surface Reference

#### Storefront Endpoints (`/api/storefront`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/storefront/auth/register` | Public | Registers customer account and issues session cookie |
| `POST` | `/api/storefront/auth/login` | Public | Verifies Argon2id credentials, sets cookie & returns CSRF |
| `POST` | `/api/storefront/auth/logout` | Authenticated | Revokes session token in database |
| `POST` | `/api/storefront/auth/forgot-password` | Public | Generates single-use reset token and emails via Resend |
| `POST` | `/api/storefront/auth/reset-password` | Public | Validates token, updates password, revokes all sessions |
| `GET` | `/api/storefront/products` | Public | Lists catalog with search, category & price filters |
| `GET` | `/api/storefront/products/{slug}` | Public | Retrieves detailed product information |
| `GET` | `/api/storefront/cart` | Authenticated | Returns customer active cart with current subtotals |
| `POST` | `/api/storefront/cart/items` | Authenticated | Adds product item with stock limit checks |
| `PATCH` | `/api/storefront/cart/items/{id}` | Authenticated | Updates quantity of existing cart item |
| `DELETE` | `/api/storefront/cart/items/{id}` | Authenticated | Removes item from cart |
| `POST` | `/api/storefront/checkout` | Authenticated | Locks inventory and creates 300s stock reservation |
| `POST` | `/api/storefront/payments` | Authenticated | Idempotent payment processing with simulated gateway |
| `GET` | `/api/storefront/orders` | Authenticated | Lists personal order history |
| `GET` | `/api/storefront/orders/{id}` | Authenticated | Retrieves itemized receipt for specific order |
| `GET` | `/api/storefront/profile` | Authenticated | Fetches customer profile information |
| `PATCH` | `/api/storefront/profile` | Authenticated | Updates personal profile information |
| `POST` | `/api/storefront/profile/avatar` | Authenticated | Uploads and associates avatar image |

#### Admin Endpoints (`/api/admin`)
| Method | Path | Auth Required | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/stats` | Admin | Aggregate dashboard KPIs (GMV, order counts, stock levels) |
| `GET` | `/api/admin/users` | Admin | Paginated user management table with role filters |
| `PATCH` | `/api/admin/users/{id}/role` | Admin | Updates user role (enforces safeguard checks) |
| `DELETE` | `/api/admin/users/{id}` | Admin | Soft-deletes user (prevents self-deletion) |
| `GET` | `/api/admin/products` | Admin | Lists complete product inventory including inactive items |
| `POST` | `/api/admin/products` | Admin | Creates new product with auto-generated slug |
| `PATCH` | `/api/admin/products/{id}` | Admin | Updates price, description, or stock with audit diff |
| `GET` | `/api/admin/orders` | Admin | Lists all system orders with status filter |
| `POST` | `/api/admin/orders/{id}/cancel` | Admin | Cancels order, releases reservations, issues refund |
| `GET` | `/api/admin/audit-logs` | Admin | Lists chronological system audit records with JSONB diffs |

---

## 7. Production Deployment Architecture

```mermaid
graph LR
    subgraph ClientLayer ["Client Devices"]
        Browser["Desktop & Mobile Browsers"]
    end

    subgraph VercelEdge ["Vercel Edge Network (Global CDN)"]
        VercelT1["Task 01: POS Frontend<br/>pos-ecommerce-systems.vercel.app"]
        VercelT2["Task 02: E-Commerce UI<br/>pos-ecommerce-systems-zb3q.vercel.app"]
    end

    subgraph RenderCloud ["Render Cloud Platform"]
        RenderT1["Task 01: FastAPI Backend<br/>techloom-pos-api.onrender.com"]
        RenderDB["Render PostgreSQL 16<br/>Managed Database Storage"]
    end

    subgraph RailwayCloud ["Railway Production PaaS (us-east-4)"]
        RailwayAPI["FastAPI Application Server<br/>Uvicorn ASGI (Python 3.10)"]
        RailwaySweeper["Async Sweeper Task<br/>(Background Event Loop 15s)"]
        RailwayDB["PostgreSQL 16 Engine<br/>Managed Database Storage"]
    end

    subgraph ExternalSaaS ["Cloud Email Service"]
        ResendMail["Resend Email API<br/>(Transactional Reset Delivery)"]
    end

    Browser -->|HTTPS| VercelT1
    Browser -->|HTTPS| VercelT2
    VercelT1 -->|HTTPS REST| RenderT1
    RenderT1 -->|TCP 5432| RenderDB
    VercelT2 -->|HTTPS REST + Credentials| RailwayAPI
    RailwayAPI -->|Internal Async Loop| RailwaySweeper
    RailwayAPI -->|TCP 5432 / Connection Pool| RailwayDB
    RailwaySweeper -->|Row Locks SKIP LOCKED| RailwayDB
    RailwayAPI -->|HTTPS REST| ResendMail
```

---

## 8. Technology Stack Comparison

| Layer | Task 01: POS Order System | Task 02: Enterprise E-Commerce Platform |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI 0.141.1 (Python 3.10+) | FastAPI 0.141.1 (Python 3.10+) |
| **Database Engine** | PostgreSQL 16 (Render Cloud / Docker local) | PostgreSQL 16 (Railway Managed Cloud Database) |
| **ORM Layer** | SQLAlchemy 2.0.52 | SQLAlchemy 2.0.53 |
| **Database Driver** | `psycopg` (v3.2.3) | `psycopg2-binary` (v2.9.10) |
| **Schema Migrations** | Alembic | Alembic (Full multi-revision migration history) |
| **Password Hashing** | `bcrypt` (4.2.1, 12 rounds) | `argon2-cffi` (23.1.0, Argon2id RFC 9106) |
| **Session Architecture** | Server-side sessions with SHA-256 tokens | Server-side sessions with SHA-256 tokens & CSRF protection |
| **Data Validation** | Pydantic v2 (2.10.4) | Pydantic v2 (2.10.4) |
| **Email Gateway** | Not applicable for POS register | Resend Transactional Email API (`resend` SDK) |
| **Image Processing** | Not applicable | Pillow (Avatar resizing and normalization) |
| **Frontend Framework** | React 19.0.0 | React 19.0.0 |
| **Routing** | Single-page view container | React Router v7.1.3 |
| **Build Tooling** | Vite 8.0.0 | Vite 8.0.0 |
| **CSS Styling** | Tailwind CSS v4.0.0 | Tailwind CSS v3.4.17 (with PostCSS & Autoprefixer) |
| **Icon System** | Lucide React (1.16.0) | Lucide React (1.16.0) |
| **Cloud Hosting** | Vercel (Frontend) + Render (Backend API + Render PostgreSQL) | Vercel (Frontend) + Railway (Backend API + Postgres) |

---

## 9. Feature Comparison Matrix

| Feature / Capability | Task 01 (POS System) | Task 02 (E-Commerce Platform) |
| :--- | :---: | :---: |
| Product Catalog Browsing | ✓ | ✓ |
| Product Search & Category Filters | — | ✓ |
| Product Creation & Updates | ✓ (Manager) | ✓ (Admin) |
| Real-Time Stock Counter | ✓ | ✓ |
| Active Shopping Cart | ✓ | ✓ |
| Deterministic Row-Level Locking (`FOR UPDATE`) | ✓ | ✓ |
| Stock Reservation on Checkout | ✓ (5-min TTL) | ✓ (5-min TTL) |
| Automated Background Reservation Sweeper | ✓ (Every 5s) | ✓ (Every 15s with `SKIP LOCKED`) |
| Stock Restoration on Expiration | ✓ | ✓ |
| Payment Gateway Simulation (`SUCCESS`, `FAILURE`, `TIMEOUT`) | ✓ | ✓ |
| Distributed Idempotency Key Guard | ✓ | ✓ (Dedicated `IdempotencyRecord` table) |
| Order Cancellation & Stock Restoration | ✓ | ✓ |
| Refund Simulation | — | ✓ |
| Role-Based Access Control | ✓ (Cashier, Manager) | ✓ (Customer, Admin) |
| Admin Application Shell Navigation | — | ✓ (Fixed 240px Shell) |
| Structured JSONB Audit Logging | — | ✓ |
| Transactional Password Reset Email | — | ✓ (Resend API) |
| Avatar Image Upload | — | ✓ |

---

## 10. Assessment Requirement Traceability Matrix

| Assessment Requirement | Task | Implementation Module / File | Verification & Test Evidence |
| :--- | :---: | :--- | :--- |
| **Product CRUD** | 01 | `task-01/app/api/products.py` | API endpoint tests in `test_api_users.py` |
| **Prevent Overselling** | 01 | `task-01/app/services/checkout.py` | Concurrency lock in `test_checkout_service.py` |
| **5-Minute Reservation** | 01 | `task-01/app/services/checkout.py` | TTL creation verified in checkout tests |
| **Reservation Expiry Worker** | 01 | `task-01/app/services/expiry.py` | Background task runs every 5s with `SKIP LOCKED` |
| **Payment Success/Failure/Timeout** | 01 | `task-01/app/services/payment.py` | Simulated outcomes in payment service tests |
| **Duplicate Payment Protection** | 01 | `task-01/app/services/payment.py` | Unique key checks in `test_security.py` |
| **Product Discovery & Search** | 02 | `task-02/backend/app/api/storefront/products.py` | Tested in `test_catalog_and_cart.py` |
| **Persistent Cart Management** | 02 | `task-02/backend/app/api/storefront/cart.py` | Tested in `test_catalog_and_cart.py` |
| **Deterministic Checkout Locks** | 02 | `task-02/backend/app/services/checkout_service.py` | Tested in `test_checkout_concurrency.py` |
| **Automated Sweeper Service** | 02 | `task-02/backend/app/services/sweeper_service.py` | Tested in `test_reservation_expiry.py` |
| **Payment Idempotency Table** | 02 | `task-02/backend/app/services/payment_service.py` | Tested in `test_payment_idempotency.py` |
| **Argon2id & CSRF Security** | 02 | `task-02/backend/app/core/security.py` | Tested in `test_session_auth_and_csrf.py` |
| **Admin RBAC & Safeguards** | 02 | `task-02/backend/app/api/admin/users.py` | Tested in `test_admin_rbac_and_safeguards.py` |
| **Order Cancellation & Refund** | 02 | `task-02/backend/app/api/admin/orders.py` | Tested in `test_order_cancellation_and_refund.py` |
| **JSONB Audit Logging** | 02 | `task-02/backend/app/services/audit_service.py` | Tested in `test_audit_identity.py` |
| **Resend Password Recovery** | 02 | `task-02/backend/app/services/resend_service.py` | Tested in `test_resend_email.py` |

---

## 11. Testing & Quality Verification

### Task 02 Backend Automated Pytest Suite
The Task 02 backend features 21 automated unit and integration tests executing against an isolated test database configuration:

```bash
# Executed from task-02/ directory
python -m pytest backend/tests/ -v
```

```
============================= test session starts =============================
platform win32 -- Python 3.10.11, pytest-8.3.4, pluggy-1.5.0
rootdir: C:\Users\arudk\Downloads\techloom-software-engineer-assessment\task-02
collected 21 items

backend/tests/test_admin_rbac_and_safeguards.py::test_admin_can_list_users PASSED
backend/tests/test_admin_rbac_and_safeguards.py::test_customer_cannot_access_admin PASSED
backend/tests/test_admin_rbac_and_safeguards.py::test_admin_cannot_delete_self PASSED
backend/tests/test_argon2_password.py::test_argon2_hashing_and_verification PASSED
backend/tests/test_audit_identity.py::test_audit_log_captures_actor_and_diff PASSED
backend/tests/test_catalog_and_cart.py::test_catalog_browsing_and_filtering PASSED
backend/tests/test_catalog_and_cart.py::test_cart_lifecycle_and_quantity_caps PASSED
backend/tests/test_checkout_concurrency.py::test_concurrent_checkout_stock_reservation PASSED
backend/tests/test_money_calculations.py::test_monetary_exactness_and_decimal_rounding PASSED
backend/tests/test_order_cancellation_and_refund.py::test_order_cancellation_restores_stock PASSED
backend/tests/test_payment_idempotency.py::test_payment_idempotency_same_payload PASSED
backend/tests/test_payment_idempotency.py::test_payment_idempotency_mismatched_payload PASSED
backend/tests/test_payment_idempotency.py::test_payment_timeout_state_transition PASSED
backend/tests/test_profile_and_avatar.py::test_profile_update_and_avatar_upload PASSED
backend/tests/test_resend_email.py::test_password_reset_token_issuance_and_consumption PASSED
backend/tests/test_reservation_expiry.py::test_sweeper_restores_expired_reservation_stock PASSED
backend/tests/test_session_auth_and_csrf.py::test_session_cookie_issuance_and_invalidation PASSED
backend/tests/test_session_auth_and_csrf.py::test_csrf_token_enforcement_on_mutating_requests PASSED
backend/tests/test_session_auth_and_csrf.py::test_unauthenticated_requests_blocked PASSED
backend/tests/test_session_auth_and_csrf.py::test_soft_deleted_user_session_revocation PASSED
backend/tests/test_session_auth_and_csrf.py::test_session_expiry_handling PASSED

======================== 21 passed, 2 warnings in 3.16s ========================
```

### Task 02 Frontend Build Verification
```bash
cd task-02/frontend
npm run build
```
- **TypeScript Compiler (`tsc`):** 0 Errors
- **Linter (`oxlint` / `eslint`):** 0 Errors, 0 Warnings
- **Vite Build Output:** Emitted production bundle to `dist/` in 1.68 seconds

### Task 01 Test Suite Status
The Task 01 backend includes 7 comprehensive integration test suites (`test_api_auth.py`, `test_api_users.py`, `test_cart_service.py`, `test_checkout_service.py`, `test_handler_attribution.py`, `test_security.py`, `test_seed_demo_users.py`). Test collection requires a running PostgreSQL instance specified via `DATABASE_URL`. In offline environments without an active PostgreSQL service, tests exit at initialization due to strict Pydantic database URL validation.

---

## 12. Engineering Quality Pillars

### 1. Reliability & Data Consistency
- **Atomic State Boundaries:** All checkout operations (locking, stock decrement, reservation creation, cart status update) execute within a single transaction boundary.
- **Deadlock Elimination:** Locks on products are always acquired in ascending ID order, guaranteeing that circular wait conditions cannot occur across concurrent transactions.
- **Stock Invariant Guarantees:** Database-level `CHECK (available_stock >= 0)` constraints guarantee that inventory counts can never fall below zero under any system load.

### 2. Security & Defensive Design
- **Memory-Hard Password Hashing:** Argon2id parameters (RFC 9106) protect credentials against GPU-accelerated brute-force attacks.
- **Token Protection:** Raw session tokens are never stored in plain text in the database. Only their SHA-256 digest is persisted.
- **Storage Hygiene:** No authentication credentials or session tokens are ever placed in `localStorage` or `sessionStorage`. All authentication state is managed via secure, `HttpOnly`, `SameSite=Lax` cookies with explicit CSRF token verification.
- **Administrator Safeguards:** Hardened business logic prevents administrators from demoting, deactivating, or deleting their own accounts or removing the final administrator on the platform.

### 3. Maintainability & Code Organization
- **Separation of Concerns:** Clear three-tier architecture cleanly isolating API route controllers, business logic service classes, data access repositories, and relational models.
- **Contract Integrity:** Strict Pydantic v2 schemas validate all inputs and serialize all outputs, preventing data leakage.
- **Schema Evolution:** Managed Alembic migrations maintain a deterministic, version-controlled database history.

---

## 13. UI/UX Design Philosophy & Journeys

The Task 02 user interface is crafted as a real-world commerce experience emphasizing trust, clarity, and predictable navigation:

> **Design Philosophy:** The storefront is designed around clarity, trust, predictable navigation, restrained visual hierarchy, responsive behavior, and a realistic commerce flow rather than an assessment/demo interface.

### Customer Journey
```mermaid
flowchart LR
    Browse[1. Browse Catalog] --> Details[2. Product Details]
    Details --> Cart[3. Shopping Cart]
    Cart --> Address[4. Delivery Address]
    Address --> Reserve[5. Stock Reservation]
    Reserve --> Pay[6. Payment Authorization]
    Pay --> Receipt[7. Order Confirmation]
    Receipt --> History[8. Order History]
```

### Administrator Journey
```mermaid
flowchart TD
    Admin[Admin Login] --> Shell[Admin Application Shell]
    Shell --> Dash[Dashboard: GMV & Status Metrics]
    Shell --> Users[Users: Role Promotions & Demotions]
    Shell --> Products[Products: Catalog & Stock Adjustments]
    Shell --> Orders[Orders: Status Inspection & Refunds]
    Shell --> Audit[Audit Logs: Chronological JSONB Diffs]
```

---

## 14. Local Development & Environment Setup

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** 18.x or 20.x LTS
- **Docker & Docker Compose:** For running PostgreSQL locally

---

### Running Task 01 (POS Order System)

#### 1. Start Local PostgreSQL Database
```bash
cd task-01
docker compose up -d
```
*Starts PostgreSQL 16 on port 5432 with database `techloom_pos`.*

#### 2. Configure Environment
Create `task-01/.env`:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/techloom_pos
ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
SECRET_KEY=dev-pos-secret-key-32-characters-minimum!
SESSION_EXPIRE_MINUTES=480
SEED_DEMO_USERS=true
COOKIE_SAMESITE=lax
```

#### 3. Install Backend Dependencies & Start Server
```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 4. Install Frontend Dependencies & Start UI
```bash
cd frontend
npm install
npm run dev -- --port 5173
```
*Open `http://localhost:5173` to access the POS terminal.*

---

### Running Task 02 (Enterprise E-Commerce Platform)

#### 1. Configure Backend Environment
Create `task-02/backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/task02_ecommerce
SESSION_SECRET=dev-ecommerce-session-secret-key-32-chars-min!
SESSION_COOKIE_NAME=techloom_session
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_SAMESITE=lax
SESSION_MAX_AGE_SECONDS=604800
RESERVATION_TTL_SECONDS=300
SWEEPER_INTERVAL_SECONDS=15
MEDIA_DIR=./media
MAX_UPLOAD_SIZE_BYTES=5242880
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
FRONTEND_URL=http://localhost:5173

# Optional: Transactional Email via Resend
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

#### 2. Apply Database Migrations & Start Backend
```bash
cd task-02/backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8001
```
*The application automatically starts the background 15-second reservation sweeper.*

#### 3. Start Frontend UI
```bash
cd ../frontend
npm install
npm run dev -- --port 5173
```
*Open `http://localhost:5173` to browse the storefront or access the admin console.*

---

## 15. Environment Variables Reference

### Task 01 Backend Environment Variables
| Variable | Purpose | Required | Example / Default |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql+psycopg://user:pass@localhost:5432/techloom_pos` |
| `ENVIRONMENT` | Runtime mode (`development` / `production`) | Yes | `development` |
| `FRONTEND_URL` | Allowed origin for CORS headers | Yes | `http://localhost:5173` |
| `SECRET_KEY` | Secret key for session signature validation | Yes | Minimum 32 characters |
| `SESSION_EXPIRE_MINUTES` | Lifetime of active cashier session | No | `480` (8 hours) |
| `SEED_DEMO_USERS` | Auto-seeds default cashier/manager accounts | No | `true` |
| `COOKIE_SAMESITE` | Cookie SameSite enforcement policy | No | `lax` |

### Task 02 Backend Environment Variables
| Variable | Purpose | Required | Example / Default |
| :--- | :--- | :---: | :--- |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://user:pass@host:port/task02_ecommerce` |
| `SESSION_SECRET` | Cryptographic secret for session cookies | Yes | Minimum 32 characters |
| `SESSION_COOKIE_NAME` | Name of the authentication cookie | No | `techloom_session` |
| `SESSION_COOKIE_SECURE` | Set `true` in production (requires HTTPS) | No | `false` (dev) / `true` (prod) |
| `SESSION_COOKIE_SAMESITE` | Cookie SameSite policy | No | `lax` |
| `SESSION_MAX_AGE_SECONDS` | Session token lifetime in seconds | No | `604800` (7 days) |
| `RESERVATION_TTL_SECONDS` | Stock reservation window duration | No | `300` (5 minutes) |
| `SWEEPER_INTERVAL_SECONDS`| Frequency of background reservation sweeper | No | `15` seconds |
| `MEDIA_DIR` | Local disk directory for avatar uploads | No | `./media` |
| `MAX_UPLOAD_SIZE_BYTES` | Maximum allowable avatar upload size | No | `5242880` (5 MB) |
| `CORS_ORIGINS` | Comma-delimited list of allowed origins | Yes | `http://localhost:5173` |
| `FRONTEND_URL` | Base URL used to build password reset links | Yes | `http://localhost:5173` |
| `RESEND_API_KEY` | API key for transactional email dispatch | No | `re_...` |
| `RESEND_FROM_EMAIL` | Sender email address for transactional email | No | `onboarding@resend.dev` |

### Task 02 Frontend Environment Variables
| Variable | Purpose | Required | Example / Default |
| :--- | :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Base URL of the backend API service | No | Empty (uses Vite proxy) or Railway URL |

---

## 16. Responsive Design & Viewport QA Matrix

The Task 02 user interface has been verified against standard device viewports and zoom configurations:

| Viewport Width | Target Device Category | Verification Focus | Status |
| :---: | :--- | :--- | :---: |
| **320px** | Ultra-compact mobile (iPhone SE 1st gen) | Form inputs stack, no horizontal scrollbar | Verified |
| **375px** | Standard compact mobile (iPhone mini) | Navigation drawer operates, button hit targets ≥ 44px | Verified |
| **390px** | Modern mobile (iPhone 14 / 15) | Catalog cards align 1-column, bottom cart bar accessible | Verified |
| **414px** | Large mobile (iPhone Plus / Max) | Product details typography and badges readable | Verified |
| **480px** | Phablet / Landscape compact | Filters collapsible, address fields stack cleanly | Verified |
| **768px** | Tablet portrait (iPad Mini / Air) | Storefront shifts to 2-column grid, table headers wrap | Verified |
| **1024px** | Tablet landscape / Small laptop | Storefront shifts to 3-column grid, checkout layout 2-col | Verified |
| **1280px** | Standard desktop display | Fixed admin sidebar (240px) renders with independent scroll | Verified |
| **1366px** | Typical laptop screen | Dashboard KPI cards render in 4-column layout | Verified |
| **1440px** | Widescreen workstation | Container max-widths constrain content pleasantly | Verified |
| **1536px** | High-DPI laptop (Surface / MacBook) | Font weights and border radii render crisply | Verified |
| **1920px** | Full HD desktop monitor | Admin tables utilize available width without awkward gaps | Verified |

### Zoom Level Verification
- **100% Zoom:** Baseline production layout.
- **125% Zoom:** Layout reflows gracefully without clipping modal dialogs or buttons.
- **150% Zoom:** Text containers expand without overlapping adjacent interactive controls.
- **200% Zoom:** Media queries adapt cleanly to mobile-equivalent layouts with accessible scroll regions.

---

## 17. Security Implementation Matrix

| Security Domain | Task 01: POS Order System | Task 02: Enterprise E-Commerce Platform |
| :--- | :--- | :--- |
| **Password Hashing** | `bcrypt` (12 rounds of work factor) | `argon2-cffi` (Argon2id, 64MB memory cost, 3 iterations) |
| **Session Transport** | `HttpOnly`, `SameSite=Lax` cookies | `HttpOnly`, `SameSite=Lax`, Secure in production |
| **Session Storage** | Server-side database, SHA-256 token digest | Server-side database, SHA-256 token digest |
| **CSRF Defense** | SameSite cookie policy | Synchronizer CSRF tokens verified on mutating requests |
| **Role-Based Access** | `cashier` vs `manager` roles | `CUSTOMER` vs `ADMIN` roles |
| **Idempotency** | Unique `idempotency_key` per payment record | `IdempotencyRecord` table with payload SHA-256 hash |
| **Input Validation** | Strict Pydantic v2 schemas | Strict Pydantic v2 schemas |
| **Database Constraints** | `CHECK (available_stock >= 0)`, `CHECK (quantity > 0)` | `CHECK (available_stock >= 0)`, `CHECK (quantity > 0)` |
| **Audit Trails** | Chronological order and payment records | Immutable `AuditLog` table with JSONB diff snapshots |
| **Secret Management** | Environment variables, `.env` git-ignored | Environment variables, `.env` git-ignored |

---

## 18. State Machine Comparative Analysis

```mermaid
graph TD
    subgraph T1_OrderState ["Task 01 Order States"]
        T1_P[Pending] --> T1_R[Reserved]
        T1_R --> T1_Paid[Paid]
        T1_R --> T1_Exp[Expired]
        T1_R --> T1_Fail[Failed]
        T1_R --> T1_Can[Cancelled]
    end

    subgraph T2_OrderState ["Task 02 Order States"]
        T2_P[PENDING] --> T2_R[RESERVED]
        T2_R --> T2_Paid[PAID]
        T2_R --> T2_Exp[EXPIRED]
        T2_R --> T2_Fail[FAILED]
        T2_R --> T2_Can[CANCELLED]
        T2_Paid --> T2_Ref[REFUNDED / CANCELLED]
    end
```

---

## 19. Architectural Decisions & Technical Rationales

### 1. Database-Level Row Locking (`SELECT ... FOR UPDATE`)
- **Context:** Multiple shoppers or cashiers can attempt to purchase the same inventory items simultaneously.
- **Decision:** Use pessimistic row-level locking ordered strictly by product identifier (`ORDER BY id ASC`).
- **Rationale:** Application-level locks (e.g. Redis locks) introduce distributed coordination failure modes and network latency. Relational database row locks guarantee ACID serialization directly at the storage engine. Ascending ID ordering completely eliminates circular deadlock conditions.

### 2. Five-Minute Reservation Window (TTL = 300 Seconds)
- **Context:** Customers must enter shipping addresses and authorize payment without having stock purchased from under them.
- **Decision:** Hold reserved inventory for 5 minutes; automatically release it if uncompleted.
- **Rationale:** Prevents inventory hoards where abandoned checkouts lock up available stock indefinitely. 5 minutes provides ample time for legitimate payment authorization while protecting commercial availability.

### 3. Server-Side Idempotency Records with Payload Hashing
- **Context:** Mobile network reconnects or double-clicks on payment buttons can submit identical payment requests twice.
- **Decision:** Guard payment and checkout endpoints with an `IdempotencyRecord` table storing a SHA-256 hash of the request payload.
- **Rationale:** Duplicate requests return the original cached response directly without re-executing transactions. Mismatched payloads submitted under an existing key are rejected with HTTP 422 to prevent replay tampering.

### 4. Stateful Server Sessions with Hashed Tokens
- **Context:** Client-side JWTs stored in `localStorage` are vulnerable to Cross-Site Scripting (XSS) extraction and cannot be immediately revoked server-side upon password reset or account compromise.
- **Decision:** Issue random 128-bit session tokens stored in `HttpOnly` cookies, persisting only their SHA-256 digest in the database.
- **Rationale:** Eliminates token leakage via XSS. Database-backed sessions allow immediate instant revocation across all customer devices when passwords are reset or accounts are locked.

---

## 20. Known Limitations & Design Boundaries

1. **Simulated Payment Gateway:** The payment processing engine simulates gateway responses (`SUCCESS`, `FAILURE`, `TIMEOUT`) to facilitate end-to-end automated testing without requiring live merchant gateway contracts (e.g. Stripe or Adyen). The state machine and idempotency behaviors are identical to production payment integrations.
2. **Transactional Email in Local Development:** The Resend email provider requires a valid `RESEND_API_KEY`. When running locally without a configured key, password reset tokens are generated and committed to the database but email delivery is bypassed.
3. **Database Dependency for Task 01 Tests:** Task 01 test suites require an active PostgreSQL instance specified via `DATABASE_URL`. In offline environments without a running database, tests exit at initialization due to strict database URL validation.

---

## 21. Final Verification & Submission Report

- **Documentation Scope:** Single, exhaustive, root-level `README.md` created at `C:\Users\arudk\Downloads\techloom-software-engineer-assessment\README.md`.
- **Application Code Integrity:** Zero application code modified; documentation generated purely from verified repository facts.
- **Diagrams Included:** 18 dedicated Mermaid diagrams covering system architecture, checkout sequences, race condition locking, reservation state machines, payment flows, database ER diagrams, idempotency workflows, authentication, and deployment topology.
- **Automated Tests Verified:** Task 02 backend tests verified with **21 passed in 3.16s**; frontend verified with **0 compile errors, 0 lint warnings**.

---

## TechLoom Assessment

Built as part of the TechLoom Software Engineer Intern Practical Assessment.

- **Monorepo Repository:** [https://github.com/arudkumaran19/pos-ecommerce-systems.git](https://github.com/arudkumaran19/pos-ecommerce-systems.git)
- **Task 01 POS Live Application:** [https://pos-ecommerce-systems.vercel.app/](https://pos-ecommerce-systems.vercel.app/)
- **Task 01 Backend API:** [https://techloom-pos-api.onrender.com/](https://techloom-pos-api.onrender.com/)
- **Task 02 E-Commerce Live Application:** [https://pos-ecommerce-systems-zb3q.vercel.app/](https://pos-ecommerce-systems-zb3q.vercel.app/)
- **Task 02 Backend API:** [https://pos-ecommerce-systems-production.up.railway.app](https://pos-ecommerce-systems-production.up.railway.app)
