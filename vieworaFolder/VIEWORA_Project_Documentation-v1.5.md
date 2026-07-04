# VIEWORA — E-Commerce Website
## Complete Project Documentation (v1.5)

**Project Type:** E-Commerce Website — Eyewear/Optical Products
**Team:** 2 members (Backend + Frontend split)
**Start Date:** 3 July 2026
**Stack:** Next.js (App Router) + Node.js/Express + PostgreSQL + PhonePe Payment Gateway

> **v1.5 Changelog** (4 July 2026) — Integrated detailed Coupon specs & updated Hosting/Security ownership:
> - **Coupon Rules Defined:** Earned when order subtotal >= ₹5,000. Value is dynamically calculated as **10% of that order's subtotal** (e.g., ₹5,000 subtotal generates a ₹500 flat discount coupon).
> - **Coupon Expiry & Reminders:** Valid for 90 days. Expiry reminders sent via Email on days 88 and 89 before expiring on day 90.
> - **Coupon Deduction Flow:** When applied, coupon discount shows as a deduction line item, reducing the subtotal: `final_payable_amount = subtotal - discount_amount + shipping_fee`.
> - **Coupons Deferred to v1.1:** Schema models restored to DB Section so they are pre-planned, but API endpoints and jobs remain in v1.1 scope.
> - **Hosting & Security Ownership:** Confirmed as the client's team responsibility (deployment/infrastructure). Application-level security (sanitization, auth, JWT, CSRF, rate-limiting) remains our responsibility in the codebase.
> - Shipping fee locked: **flat ₹99** per order.
> - GST confirmed: **inclusive** in displayed prices.

---

## Table of Contents

1. Project Overview
2. Goals & Scope
3. Assumptions & Risks (Hosting/Security update)
4. Technology Stack
5. System Architecture
6. Folder Structure
7. Database Schema (Restored pre-planned Coupon tables)
8. API Endpoint Contract
9. Authentication Strategy
10. Payment Integration (PhonePe)
11. Security & Data Privacy
12. Admin Interface Scope
13. Site Map & Navigation
14. Page-by-Page Breakdown
15. User Flow / Workflow
16. Typography & Content Reference
17. Team Responsibilities
18. Timeline
19. Success Criteria
20. Future Scope (v1.1+)
21. UX/Design Reference (blix.in)
22. Detailed Coupon & Discount Logic (v1.1 Spec)
23. Notification System (v1: Order Confirmation Email Only)
24. Animations & Micro-interactions
25. Inventory Concurrency & Stock Reservation
26. Error Response Contract
27. Logging & Observability Strategy
28. Refunds & Cancellations
29. Pre-Build Decision Checklist (Final)

---

## 1. Project Overview

VIEWORA is a modern, responsive e-commerce website for a premium eyewear brand, selling sunglasses, eyeglasses, blue light glasses, and reading glasses. The platform prioritizes clean UI, fast performance, secure authentication, intuitive navigation, and a smooth end-to-end shopping journey from browsing through checkout to real payment via PhonePe.

---

## 2. Goals & Scope

### Goals
- Build a premium-looking, fully responsive e-commerce website
- Showcase eyewear collections with strong visual merchandising
- Enable easy browsing, filtering, and searching of products
- Secure customer authentication (register/login)
- Functional shopping cart and wishlist
- Real payment processing via PhonePe
- Minimal admin interface for product/order management

### In Scope (v1 — Core, Non-Negotiable)
- Home, Shop, Collection, Shop Collection, Product Details, About, Contact pages
- Customer authentication: email + password (primary), email OTP optional
- Product variants (color/size/lens type/material), shopping cart + wishlist
- Product search and filters
- Real checkout with PhonePe payment integration
- Flat ₹99 shipping fee on all orders
- GST-inclusive pricing — prices shown already include tax, no surprise line at checkout
- Minimal admin panel (product/variant CRUD, order management, refund initiation)
- Fully responsive design (desktop/tablet/mobile)
- Order confirmation email on successful payment

### Future Scope — v1.1 (explicitly out of v1)
- Coupon / order-threshold reward system (Detailed in Section 22)
- Referral / cashback program
- WhatsApp OTP authentication (client's business phone via Meta Cloud API)
- WhatsApp + automated email notification system (coupon expiry reminders)

### Future Scope — v2+
- Order tracking with shipment status updates
- Full admin dashboard (analytics, bulk operations, role-based permissions)
- Product reviews and ratings
- Multi-language / multi-currency support

---

## 3. Assumptions & Risks

### Assumptions
- Small product catalog — single brand, single region (India), single currency (INR)
- PhonePe Standard Checkout flow, starting in sandbox/UAT before going live
- Product catalog seeded and managed through the admin panel (no bulk import for a small catalog)
- Backend: Node.js + Express, ORM: Prisma, DB: PostgreSQL, Image storage: Cloudinary
- **Hosting is client's responsibility:** The client's infrastructure/hosting team handles AWS, server deployment, domain management, SSL, and network-level security. We deliver clean, tested code and deployment documentation.
- Frontend: Next.js (App Router) for SSR/SEO
- Primary auth: email + password; WhatsApp OTP deferred to v1.1
- Shipping: flat ₹99 on every order
- GST is baked into displayed product prices — `orders.tax_amount = 0` at checkout

### Risks
- **Timeline compression**: 4-week timeline is realistic if scope stays locked. Any additions mid-build need a corresponding removal or timeline extension.
- **Payment integration complexity**: PhonePe checksum verification and callback idempotency are the highest-risk areas. Needs dedicated sandbox testing time.
- **Two taxonomies over one product set**: Shop (by type) and Collection (by curation) share the same products — modelled as many-to-many to avoid duplicate records.
- **PhonePe redirect and cookie policy**: PhonePe redirects back cross-origin — `SameSite=Strict` cookies will not be sent. Addressed by using `SameSite=Lax` (see Section 9).
- **Security Handoff Boundaries:** Application-level security (password hashing, JWT rotation, CSRF protection, input sanitization, rate-limiting, CORS setup) is strictly our responsibility inside the code. Infrastructure-level security (firewalls, server patching, DB backups, AWS access keys) is the client's responsibility.

---

## 4. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js (App Router), Context API | SSR/SSG for crawlable product pages and dynamic meta tags — critical for SEO |
| Backend | Node.js + Express | Team preference; mature ecosystem |
| ORM | Prisma | Type-safe queries, clean migrations |
| Database | PostgreSQL | ACID compliance for orders/payments/inventory |
| Payment Gateway | PhonePe (Standard Checkout) | Strong UPI support for Indian market |
| Image Storage | Cloudinary | CDN + optimization. Can migrate to S3 + CloudFront on AWS if preferred |
| Auth | Email + Password (primary) / Email OTP (optional) | WhatsApp OTP in v1.1 via client business phone + Meta Cloud API |
| Frontend Hosting | Managed by client team | (Recommended: Vercel or AWS Amplify) |
| Backend Hosting | Managed by client team | (Recommended: AWS EC2/ECS - Paid tier for warm server) |
| Database Hosting | Managed by client team | (Recommended: AWS RDS PostgreSQL for automatic backups) |
| Testing | Jest (backend), React Testing Library (frontend), Playwright (E2E) | |
| Email | Nodemailer + AWS SES | AWS SES recommended — cheap, reliable, same AWS account |
| Job Scheduling | node-cron (in-process) | Stock reservation cleanup only in v1; coupon expiry job added in v1.1 |
| Logging | pino (structured JSON) | See Section 27 |

---

## 5. System Architecture

Pattern: Node.js/Express REST API backend + Next.js (App Router) frontend with SSR for product, category, and collection pages. Monolith backend — right-sized for a small catalog and a 2-person team.

Why SSR matters: Product pages need to rank on Google. A client-only SPA serves an empty shell to crawlers; Next.js renders product HTML server-side and enables per-page dynamic meta tags and OG images so every product gets indexed individually.

```
Next.js Frontend (SSR) <--REST API--> Express Backend <--> PostgreSQL (AWS RDS)
                                            |
                                            +--> PhonePe Payment Gateway
                                            +--> Cloudinary (image storage)
                                            +--> AWS SES (order confirmation emails)
```

- Frontend and backend deploy independently
- Backend is stateless (JWT-based) — horizontally scalable later
- API versioned under `/api/v1/` from day one

---

## 6. Folder Structure

```
vieworaFolder/
├── client/                       # Next.js app (App Router)
│   ├── app/
│   │   ├── (shop)/               # Route group: home, shop, collection, product pages (SSR)
│   │   ├── admin/                # Protected admin routes
│   │   ├── layout.tsx
│   │   └── metadata.ts           # Shared/dynamic meta tag helpers
│   ├── components/               # Reusable UI components
│   ├── context/                  # Auth/cart global state
│   ├── services/                 # API call wrappers
│   ├── styles/
│   ├── __tests__/                # Component tests (React Testing Library)
│   └── package.json
│
├── server/                       # Express app (backend)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/               # Prisma schema/models
│   │   ├── middleware/           # Auth guard, admin guard, error handler
│   │   ├── services/             # PhonePe, email (order confirmation), Cloudinary
│   │   ├── jobs/                 # node-cron: stock reservation cleanup only (v1)
│   │   ├── lib/                  # Logger (pino), utility helpers
│   │   └── config/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── .env.development          # Sandbox keys
│   ├── .env.production           # Live keys (AWS RDS, PhonePe production, etc.)
│   ├── .env.test
│   ├── .env.example              # Committed — documents every required variable
│   └── package.json
│
├── e2e/                          # Playwright E2E tests
│   ├── checkout.spec.ts
│   ├── auth.spec.ts
│   └── playwright.config.ts
│
└── README.md
```

---

## 7. Database Schema

Normalization: 3NF. Product categorization uses join tables for many-to-many. 

> **Planning Note:** Coupon and referral tables are included in the schema draft as *nullable/optional fields* so the database can be created with future-proofing for the v1.1 release, avoiding major schema migration breaks later.

### Tables

**users**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR | |
| email | VARCHAR (unique) | Primary identifier — required |
| phone | VARCHAR (unique, nullable) | Optional in v1; primary OTP identifier in v1.1 |
| password_hash | VARCHAR (nullable) | Null until user sets a password |
| role | ENUM('customer','admin') | Default 'customer' |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**refresh_tokens**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | |
| token_hash | VARCHAR | SHA-256 hash — plaintext only ever sent to client |
| expires_at | TIMESTAMP | 7–30 days |
| revoked_at | TIMESTAMP (nullable) | Set on rotation, logout, or force-revoke |
| created_at | TIMESTAMP | |

> Rotation: Each `/auth/refresh` call revokes the old token and issues a new pair. A previously-revoked token being presented signals potential theft — all user tokens revoked immediately.

**addresses**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id, nullable) | Nullable — guest-created addresses can merge later |
| guest_email | VARCHAR (nullable) | For guest checkout address merge matching |
| label | VARCHAR (nullable) | e.g. "Home", "Office" |
| name | VARCHAR | Recipient name |
| line1, line2 | VARCHAR | |
| city, state, pincode | VARCHAR | |
| is_default | BOOLEAN | Default false |

**categories** (Shop taxonomy: Sunglasses, Eyeglasses, Blue Light, Reading Glasses)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR (unique) | |
| slug | VARCHAR (unique) | |

**collections** (Curated: Best Sellers, New Arrivals, Luxury Branded, International Brands, Wooden, Premium, etc.)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR (unique) | |
| slug | VARCHAR (unique) | |
| description | TEXT | |

**products** (parent style — display unit, not orderable directly)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| name | VARCHAR | |
| slug | VARCHAR (unique) | Required for SSR URLs: /shop/aurelia-aviator. Auto-generated from name, URL-safe. |
| brand | VARCHAR | e.g. Rayban, Police, FILA |
| description | TEXT | |
| category_id | UUID (FK → categories.id) | |
| default_image_urls | TEXT[] | Cloudinary URLs — used on listing cards before a variant is selected |
| starting_price | DECIMAL(10,2) | Denormalized MIN(active variant prices). Recomputed by Postgres trigger on any variant INSERT/UPDATE/soft-delete. Used for "From ₹X" on listing pages without joining variants on every query. |
| is_active | BOOLEAN | Default true |
| deleted_at | TIMESTAMP (nullable) | Set on soft-delete; null = active |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

> **Soft-delete convention:** All public queries filter `is_active = true AND deleted_at IS NULL`. Admin queries show all products with Inactive/Deleted badge. Cart/wishlist items for soft-deleted products are flagged `product_unavailable: true` in the API response.
>
> **`starting_price` trigger:** A Postgres trigger recalculates `starting_price = MIN(price) WHERE is_active = true` for the parent product on any `product_variants` insert, update, or soft-delete. Prevents stale "From ₹999" listings when the cheapest variant is discontinued.

**product_variants** (the actual orderable SKU)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| product_id | UUID (FK → products.id) | |
| sku | VARCHAR (unique) | e.g. `VW-AVI-BLK-M` — human-readable, used in admin and on packing slips |
| color | VARCHAR (nullable) | e.g. "Matte Black", "Tortoise Brown" |
| size | VARCHAR (nullable) | Frame width where applicable, e.g. "52mm" |
| lens_type | VARCHAR (nullable) | e.g. "Polarized", "Blue Light Filter", "Photochromic" |
| material | VARCHAR (nullable) | e.g. "Acetate", "Titanium", "Wood" |
| price | DECIMAL(10,2) | GST-inclusive sale price for this specific variant |
| stock | INTEGER | Per-variant stock — reserved and decremented on purchase |
| image_urls | TEXT[] | Variant-specific images; API falls back to `products.default_image_urls` at the serializer level if empty |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

> **Single-colorway products:** A product with no real variants still gets one `product_variants` row (with `color = null`). Keeps cart/stock/order logic uniform across the catalog.

**product_collections** (join table — many-to-many)
| Column | Type | Notes |
|---|---|---|
| product_id | UUID (FK → products.id) | |
| collection_id | UUID (FK → collections.id) | |
| PRIMARY KEY | (product_id, collection_id) | |

**cart_items** (registered users only)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | Never nullable — only logged-in users have server-side cart rows |
| variant_id | UUID (FK → product_variants.id) | The specific SKU in cart |
| quantity | INTEGER | |

> **Guest cart:** Lives entirely in `localStorage` — array of `{variantId, quantity}`. Sent directly in the `POST /orders` body at checkout. On login/registration, `POST /cart/merge` moves localStorage items into `cart_items`. Stale/soft-deleted variantIds are skipped and returned as `skipped_items` with a reason.

**wishlist_items**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id) | |
| product_id | UUID (FK → products.id) | Wishlist at product (style) level — customer wishlists "Aurelia Aviator," picks color when ready to buy. Requires login. |

**coupons** (Pre-planned for v1.1 implementation)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| code | VARCHAR (unique) | Unique generated code e.g. `VW-CPN-XXXXXX` |
| value | DECIMAL(10,2) | Flat discount amount (dynamically calculated at issuance) |
| user_id | UUID (FK → users.id, nullable) | Associated user (null for guest coupon before merge) |
| guest_email | VARCHAR (nullable) | Used to track guest-issued coupons |
| guest_phone | VARCHAR (nullable) | Used to track guest-issued coupons |
| status | ENUM('active','used','expired') | Default 'active' |
| expires_at | TIMESTAMP | Set to `created_at + 90 days` |
| created_at | TIMESTAMP | |
| used_at | TIMESTAMP (nullable) | |

**orders**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| user_id | UUID (FK → users.id, nullable) | Null for guest checkout |
| guest_email | VARCHAR (nullable) | Guest checkout contact |
| guest_phone | VARCHAR (nullable) | Guest checkout contact |
| address_id | UUID (FK → addresses.id, nullable) | Set if using a saved address |
| shipping_name | VARCHAR (nullable) | Inline address — recipient name |
| shipping_line1 | VARCHAR (nullable) | Inline address |
| shipping_line2 | VARCHAR (nullable) | Inline address |
| shipping_city | VARCHAR (nullable) | Inline address |
| shipping_state | VARCHAR (nullable) | Inline address |
| shipping_pincode | VARCHAR (nullable) | Inline address |
| payment_status | ENUM('pending','paid','failed','refunded') | Tracks money |
| fulfillment_status | ENUM('unfulfilled','processing','shipped','delivered','cancelled') | Tracks the physical order |
| applied_coupon_id | UUID (FK → coupons.id, nullable) | Pre-planned Coupon FK (null if no coupon applied) |
| subtotal | DECIMAL(10,2) | Sum of `price_at_purchase × quantity` for all line items |
| discount_amount | DECIMAL(10,2) | Stored coupon discount (deducted from subtotal, default 0.00) |
| shipping_fee | DECIMAL(10,2) | Fixed ₹99 in v1 — stored on order at creation |
| final_payable_amount | DECIMAL(10,2) | `subtotal - discount_amount + shipping_fee` |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

> **Address resolution:** Either `address_id` is set (saved address) or the `shipping_*` inline fields are populated (guest checkout or unsaved address). CHECK constraint: `address_id IS NOT NULL OR shipping_line1 IS NOT NULL`.
>
> **Status combinations:** `fulfillment_status` should never advance past `unfulfilled` while `payment_status` is not `paid`. The admin UI enforces this.

**order_items**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| order_id | UUID (FK → orders.id) | |
| variant_id | UUID (FK → product_variants.id) | |
| sku_snapshot | VARCHAR | SKU copied at purchase time |
| quantity | INTEGER | |
| price_at_purchase | DECIMAL(10,2) | Price snapshot — protects against future price changes |

**stock_reservations**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| variant_id | UUID (FK → product_variants.id) | |
| order_id | UUID (FK → orders.id) | |
| quantity | INTEGER | |
| reserved_at | TIMESTAMP | |
| expires_at | TIMESTAMP | `reserved_at + 10 minutes` |
| status | ENUM('active','released','fulfilled') | |

**payments**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| order_id | UUID (FK → orders.id) | |
| merchant_transaction_id | VARCHAR (unique) | Generated by VIEWORA: `VW-{orderId}-{timestamp}`. Ties callbacks to orders before PhonePe's own ID exists. |
| phonepe_transaction_id | VARCHAR (unique, nullable) | PhonePe's ID — nullable until PhonePe responds |
| status | ENUM('initiated','success','failed') | |
| amount | DECIMAL(10,2) | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**payment_callback_logs** (raw audit trail)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| merchant_transaction_id | VARCHAR | |
| raw_payload | JSONB | Full untouched callback body from PhonePe |
| checksum_valid | BOOLEAN | |
| processed | BOOLEAN | Whether this callback changed state, or was a no-op duplicate |
| received_at | TIMESTAMP | |

**refunds**
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| order_id | UUID (FK → orders.id) | |
| payment_id | UUID (FK → payments.id) | |
| phonepe_refund_id | VARCHAR (nullable) | |
| amount | DECIMAL(10,2) | |
| reason | VARCHAR | |
| status | ENUM('initiated','processing','completed','failed') | |
| initiated_by | ENUM('customer','admin','system') | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**referrals** (Pre-planned for v1.1 implementation)
| Column | Type | Notes |
|---|---|---|
| id | UUID (PK) | |
| referrer_id | UUID (FK → users.id) | User who owns the referral code |
| referred_user_id | UUID (FK → users.id, nullable) | User who signed up using the code |
| status | ENUM('pending','qualified') | |
| generated_coupon_id | UUID (FK → coupons.id, nullable) | Issued referrer coupon |
| created_at | TIMESTAMP | |

### Indexes
- `products(slug)`, `products(category_id)`
- `product_variants(product_id)`, `product_variants(sku)`
- `cart_items(user_id)`, `wishlist_items(user_id)`
- `orders(user_id)`, `orders(payment_status)`, `orders(fulfillment_status)`
- `payments(merchant_transaction_id)`, `payments(phonepe_transaction_id)`
- `payment_callback_logs(merchant_transaction_id)`
- `refunds(order_id)`
- `refresh_tokens(user_id)`, `refresh_tokens(token_hash)`
- `coupons(code)`, `coupons(user_id)`

---

## 8. API Endpoint Contract

Base path: `/api/v1/`

See Section 26 for the standardized error response format.

### Auth
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/auth/register` | Register with email + password | No |
| POST | `/auth/login` | Login with email + password | No |
| POST | `/auth/refresh` | Rotate refresh token — old revoked, new pair issued | Refresh cookie |
| POST | `/auth/logout` | Revoke current refresh token | Yes |
| POST | `/auth/logout-all` | Revoke all refresh tokens for this user | Yes |

### User Profile
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/users/me` | Get profile | Yes |
| PATCH | `/users/me` | Update name, email | Yes |
| GET | `/users/me/addresses` | List saved addresses | Yes |
| POST | `/users/me/addresses` | Add address | Yes |
| PUT | `/users/me/addresses/:id` | Update address | Yes |
| DELETE | `/users/me/addresses/:id` | Delete address | Yes |

### Products & Variants
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/products` | List products (`?category=`, `?collection=`, `?search=`, `?page=`). Returns `starting_price`. Default filter: `is_active=true AND deleted_at IS NULL` | No |
| GET | `/products/:slug` | Product detail + all active variants | No |
| POST | `/products` | Create product (slug auto-generated) | Admin |
| PUT | `/products/:id` | Update product | Admin |
| DELETE | `/products/:id` | Soft-delete product | Admin |
| POST | `/products/:id/variants` | Add variant | Admin |
| PUT | `/variants/:id` | Update variant | Admin |
| DELETE | `/variants/:id` | Soft-delete variant | Admin |

### Categories & Collections
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/categories` | List categories | No |
| GET | `/collections` | List collections | No |
| GET | `/collections/:slug` | Products in a collection | No |

### Cart
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/cart` | Get cart. Soft-deleted variants flagged `product_unavailable: true` | Yes |
| POST | `/cart` | Add item by `variant_id` | Yes |
| PUT | `/cart/:itemId` | Update quantity | Yes |
| DELETE | `/cart/:itemId` | Remove item | Yes |
| POST | `/cart/merge` | Merge localStorage cart on login. Returns `skipped_items` for unavailable variants | Yes |

### Wishlist
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/wishlist` | Get wishlist | Yes |
| POST | `/wishlist` | Add to wishlist (`product_id`) | Yes |
| DELETE | `/wishlist/:itemId` | Remove | Yes |

### Orders & Payments
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/orders` | Create order. Body: `{items: [{variantId, quantity}], addressId or shippingAddress, appliedCouponId?, guestEmail?, guestPhone?}`. Rs.99 shipping applied automatically. Stock reserved atomically. | Optional |
| GET | `/orders` | List user orders | Yes |
| GET | `/orders/:id` | Order detail | Yes |
| POST | `/orders/:id/cancel` | Cancel if `payment_status='pending'` (immediate). If `payment_status='paid'`, creates refund request for admin approval. | Yes / guest token |
| POST | `/payments/initiate` | Start PhonePe payment. Guest orders validated by `guest_email`/`guest_phone`. | Optional |
| POST | `/payments/callback` | PhonePe S2S callback. Logged to `payment_callback_logs`, checksum-verified, deduplicated by `merchant_transaction_id`. Triggers order confirmation email on first successful process. | PhonePe only |
| GET | `/payments/status/:orderId` | Backend-verified payment status | Yes / guest token |

### Admin
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| GET | `/admin/orders` | List all orders | Admin |
| PUT | `/admin/orders/:id/fulfillment-status` | Update fulfillment (processing/shipped/delivered) — only if `payment_status='paid'` | Admin |
| POST | `/admin/orders/:id/refund` | Initiate PhonePe refund | Admin |
| GET | `/admin/products` | List all products including inactive/deleted | Admin |

### Contact
| Method | Endpoint | Purpose | Auth Required |
|---|---|---|---|
| POST | `/contact` | Submit contact form | No |

---

## 9. Authentication Strategy

### v1: Email + Password (primary)
- Registration: email + password → bcrypt hash (cost 12) → account created
- Login: email + password → verified → JWT access token (15 min) + refresh token (7 days, httpOnly cookie)
- Failed login: exponential backoff (1s → 2s → 4s → 15-minute lockout after 10 failures)

### Session Management
- JWT access token (15 min) + refresh token in httpOnly, Secure, **SameSite=Lax** cookie
- **Why Lax, not Strict:** PhonePe redirects back cross-site. Strict cookies are not sent on cross-site top-level navigations — the user would appear logged out on the payment confirmation page. Lax is sent on top-level navigations but blocked on cross-site subresource requests — correct balance.
- **Refresh token rotation:** Every `/auth/refresh` call revokes the old token and issues a new pair. Revoked token reuse triggers full session invalidation (theft detection).

### Guest Checkout
- No account needed — email + phone captured on the order
- Post-payment: "Save your details for next time?" prompt
- Guest registers with same email later → past orders merge into account

---

## 10. Payment Integration (PhonePe)

- **Flow:** PhonePe Standard Checkout — redirect-based
- **Environment:** Sandbox/UAT first; production credentials only after full end-to-end sandbox testing
- **Merchant Transaction ID:** VIEWORA generates `VW-{orderId}-{timestamp}` before calling PhonePe. Primary correlation key — exists before PhonePe's own transaction ID does.
- **Request signing:** Every outgoing request includes `X-VERIFY` header (SHA256 + salt key)
- **Callback handling (explicit idempotency):**
  1. Every callback logged to `payment_callback_logs` unconditionally, before any business logic
  2. Checksum verified — invalid → logged, rejected, no state change
  3. Duplicate check — if `payments.status` already `success` or `failed`, log with `processed=false`, return 200 to PhonePe (stops retries), no side effects
  4. First-time processing — update `payments.status`, `orders.payment_status`, fulfill stock reservation, send order confirmation email (and dynamically issue coupon if subtotal >= 5000) — all in one DB transaction
  5. Out-of-order: `success` terminal state wins over a later `failed` callback
- **Status double-check:** Backend independently calls PhonePe status API after redirect, keyed on `merchant_transaction_id`
- **Credentials:** Merchant ID and salt key only in `.env.*` files. `PHONEPE_ENV` variable controls sandbox vs production base URL. Never mixed.

---

## 11. Security & Data Privacy

### Authentication & Session
- bcrypt hashing cost 12, exponential backoff on failed logins
- JWT access tokens short-lived (15 min); refresh tokens in httpOnly cookies (not localStorage)
- Refresh token rotation with theft detection

### Data Privacy
- No card or UPI details stored — PhonePe handles payment instrument data
- Only PhonePe transaction ID + status persisted
- Sensitive PII (address, phone) encrypted at rest
- Minimal data collection — only what is needed for orders/shipping

### Application Security
- Input validation (Zod or Joi) on every endpoint including query params
- Prisma parameterized queries (SQL injection prevented by default)
- CSRF: `SameSite=Lax` cookies + `X-CSRF-Token` header on all non-GET requests (double-submit pattern)
- Rate limiting: global, with stricter limits on `/auth` and `/payments`
- Helmet.js: CSP, HSTS, X-Frame-Options headers
- CORS locked to frontend's exact domain
- `npm audit` / Dependabot as ongoing practice

### Infrastructure & Server Security
- Managed primarily by the client's team.
- HTTPS enforced everywhere (AWS ACM certificates).
- `.env.*` git-ignored; `.env.example` committed as template.
- Separate sandbox/production PhonePe credentials.

---

## 12. Admin Interface Scope (Minimal — v1)

### Included
- Admin login (same `users` table, `role='admin'`)
- Product CRUD (name, slug, brand, description, category, images)
- Variant CRUD per product (SKU, color, size, lens type, material, price, stock, images)
- Collection/category tagging (multi-select on products)
- Order list with fulfillment status updates (processing/shipped/delivered) — gated on `payment_status='paid'`
- Refund initiation for paid orders
- Product list shows all including inactive/deleted (with badge)

### Explicitly Out of v1
- Analytics/dashboards
- Bulk import/export
- Coupon/discount management (v1.1)
- Role-based admin permissions

Built as protected React routes (`/admin/*`), reusing existing components, gated by `isAdmin` backend middleware.

---

## 13. Site Map & Navigation

```
Home
├── Shop
│   ├── Sunglasses
│   ├── Eyeglasses
│   ├── Blue Light Glasses
│   ├── Reading Glasses
│   └── Product Details (/shop/:slug)
├── Collection
│   ├── Best Sellers
│   ├── New Arrivals
│   ├── Luxury Branded Eyewear
│   ├── International Brands
│   ├── Wooden Collection
│   ├── Premium
│   └── View All Products
├── Shop Collection
├── About
├── Contact
├── Login / Register
├── Account
│   ├── Profile
│   ├── Addresses
│   └── Orders
├── Cart
└── Wishlist

Admin (protected, not in main nav)
├── Products (+ Variants)
└── Orders
```

---

## 14. Page-by-Page Breakdown

### Home Page
Nav bar, hero banner, "Shop by Category" tile grid, Best Sellers carousel, New Arrivals carousel, brand pillars section, about teaser, trust badges, newsletter, footer

### Shop Page
Search bar, filters (category / brand / price range), product grid showing `starting_price`, sorting, pagination

### Collection Page
Curated groupings: Best Sellers, New Arrivals, Luxury Branded, International Brands, Wooden, Premium. Each links to `/collections/:slug`.

### Shop Collection Page
Promotional banners + category highlights, distinct from the standalone Collection page

### Product Details Page
- Variant picker (color/size/lens selects) — price and stock update per selection
- Images (variant-specific, falls back to product default)
- Add to cart, add to wishlist, description
- SSR: dynamic meta tags + OG image per product
- URL: `/shop/aurelia-aviator`

### Cart Page
- Line items (variant-level: color, size shown), quantity adjustment, remove
- Soft-deleted items shown as "No longer available — please remove"
- Subtotal + ₹99 shipping = total, proceed to checkout

### Checkout Page
- Address selection (saved addresses) or new address entry
- Order summary with applied coupon discount deduction clearly shown
- PhonePe redirect

### Order Confirmation Page
Order ID, items, subtotal, discount, shipping, total, estimated delivery. "Register to track your orders" prompt for guests.

### User Account Pages
- Profile: view/edit name, email
- Addresses: add/edit/delete, set default
- Orders: list + order detail with fulfillment status

### About Us
Brand story, mission, craftsmanship, team

### Contact Us
Contact form, email, phone, address, map embed, social links

### Policy Pages (static — placeholder copy until client provides final text)
Privacy Policy, Shipping Policy (flat ₹99, delivery estimate), Returns & Cancellations, Terms of Use

---

## 15. User Flow / Workflow

```
Landing Page
   ↓
Browse / Search Products
   ↓
View Product Details → Select Variant (color/size/lens)
   ↓
Add to Cart / Wishlist
   ↓
Proceed to Checkout → Login/Register OR Continue as Guest
   ↓
Enter / Select Address + Optionally Apply Coupon
   ↓
Review Order:
   Subtotal
   - Coupon Discount (if valid coupon is applied)
   + Shipping Fee (₹99)
   = Final Payable Amount
   ↓
PhonePe Payment Redirect
   ↓
Backend: verify callback → fulfill stock reservation → send order confirmation email (and issue new coupon if subtotal >= ₹5,000)
   ↓
Order Confirmation Page (shows breakdown with discount applied)
```

---

## 16. Typography & Content Reference

| Use | Font |
|---|---|
| Headings | Playfair Display |
| Body Text | Poppins |
| Buttons | Inter |

Sample copy:
- Hero: "See the World in Style" — eyewear crafted for comfort, clarity, and confidence
- Category grid: "Shop by Style"
- About teaser: "Designed for Every Vision"
- Newsletter: "Stay Updated" — exclusive offers and new arrivals

---

## 17. Team Responsibilities

| Area | Owner |
|---|---|
| Backend (API, DB, auth, PhonePe, email) | You |
| Frontend (Next.js UI, pages, components) | Teammate |
| Shared | API contract (Section 8) + Error format (Section 26) — source of truth for both |

Workflow: Build in parallel -- backend implements real endpoints, frontend mocks matching the same response shapes until endpoints are ready.

---

## 18. Timeline (Accelerated Schedule)

This is the locked target timeline for the v1 core storefront build:

| Phase | Deliverable | Deadline | Status |
|---|---|---|---|
| Requirement Gathering | Project Discussion & Docs | 04 July 2026 | ✅ Completed |
| UI/UX Design | Complete Website Design | 05 July 2026 | Pending |
| Frontend Development | React Components & Markup | 05 July 2026 | Pending |
| Backend Integration | APIs & Database Schema | 07 July 2026 | Pending |
| Authentication | Email Login / Register | 07 July 2026 | Pending |
| First Draft | Initial Website Prototype | 09 July 2026 | Pending |
| Product Module | Shop & Collections Page Integration | 11 July 2026 | Pending |
| Testing | Complete Website Testing (PhonePe Sandbox) | 16 July 2026 | Pending |
| Final Delivery | Production Ready Website | Yet to Decide | Pending |

> **Timeline Risk Analysis:** 
> This is a highly compressed ~12 day cycle for code delivery (Requirement Gathering to Complete Testing). It is only feasible because:
> 1. Frontend development is already scheduled for completion by July 5th (implying standard pages, styles, and layouts are already largely built or adapted, and we are not starting React UI from scratch).
> 2. High-risk features (WhatsApp, Coupons, Referrals) are deferred to v1.1.
> 3. Infrastructure & cloud setup is handled by the client's team, meaning we do not spend days setting up ECS/RDS instances.
>
> **Milestones:**
> - **July 7th:** API backend is operational and Auth is fully integrated.
> - **July 9th:** The first end-to-end prototype (frontend connected to API) is running.
> - **July 16th:** Sandbox payment verification and error-logging tests are complete.

---

## 19. Success Criteria

- Fully responsive across desktop, tablet, mobile
- All core pages implemented
- Variant picker works correctly — stock and price update per selection
- Email + password auth works end-to-end
- Cart → checkout → PhonePe → confirmation flow completes without errors
- PhonePe callbacks handled correctly (verified, idempotent, logged)
- Order confirmation email sent on successful payment
- Admin can add/update products, variants, and update order fulfillment status
- No plaintext secrets or card data stored
- Structured logging in place for all payment operations
- At least one E2E Playwright test covering the full checkout flow passes

---

## 20. Future Scope (v1.1+)

### v1.1 (fast-follow after launch)
- **Coupon System Implementation:** Enable endpoints and logic defined in Section 22
- **Referral program:** Referrer-only cashback coupon on qualifying referred purchase
- **WhatsApp OTP auth:** Client business phone registered via Meta WhatsApp Business Cloud API
- **WhatsApp notifications:** WhatsApp delivery fallback + templates

### v2+
- Order tracking / shipment status updates
- Full admin dashboard (analytics, bulk import/export, role permissions)
- Product reviews and ratings
- Multi-language / multi-currency

---

## 21. UX/Design Reference (blix.in)

Patterns worth adopting:
- **Top announcement bar** — slim persistent strip ("Secure payments via PhonePe" or "₹99 flat shipping")
- **Mega-menu on Shop** — 2-column dropdown: Shop by category (left) + Collections (right)
- **"Shop by Category" tile grid** on homepage — visual tiles, more scannable than text nav
- **Best Sellers + New Arrivals carousels** — 2 horizontal product rows, reuse same card component
- **Brand pillars section** — 3–4 icon + text columns (craftsmanship, materials, warranty, etc.)
- **Trust signal row** — "Secure Payments via PhonePe", "Genuine Frames", "Easy Returns"
- **Newsletter in footer** — persistent across all pages
- **Policy links in footer** — Privacy, Shipping (₹99 flat), Returns, Terms

What NOT to copy:
- Dense mega-menus — keep to 2 columns max
- Fast-rotating announcement bars — single static or slow-rotating message reads more premium

---

## 22. Detailed Coupon & Discount Logic (v1.1 Spec)

### 22.1 Coupon Generation Rule
- **Trigger:** When a customer completes a paid order where the subtotal (excluding shipping) is **greater than or equal to ₹5,000**.
- **Value calculation:** Dynamically calculated as **10% of that generating order's subtotal**.
  - *Example:* An order has a subtotal of ₹5,200 (excluding ₹99 shipping). 10% of ₹5,200 is ₹520. A coupon is generated with a flat discount value of **₹520.00**.
- **Timing:** Generated during the PhonePe payment callback handler *after* payment is marked successful (not when the order is initially created). This prevents generating coupons for unpaid orders.

### 22.2 Expiry & Validity Window
- **Validity:** Exactly **90 days** from the date/time of generation (`expires_at = created_at + 90 days`).
- **Reminders:** A scheduled background cron job runs daily at 9:00 AM IST. It finds all active coupons where `expires_at` is between 24 and 48 hours away (days 88 and 89). For each, it sends an email reminder warning the user of the impending expiration.
- **Expiration:** Once the server time exceeds `expires_at`, the background job automatically sets `status = 'expired'`.

### 22.3 Apply and Deduction Checkout Flow
- **Deduction logic:** At checkout, if the user enters a valid, active coupon, the API recalculates the order values:
  - `subtotal` = sum of all items in cart.
  - `discount_amount` = `coupon.value` (flat amount deducted from subtotal).
  - `shipping_fee` = ₹99.00.
  - `final_payable_amount` = `subtotal - discount_amount + shipping_fee`.
- **UI Presentation:** The checkout order summary displays:
  - Subtotal: ₹[X]
  - Coupon Discount: -₹[Coupon Value] (shows code applied)
  - Shipping Fee: ₹99
  - **Final Price:** ₹[Final Payable Amount]
- **Validity Check:** The API rejects coupon application if:
  - Coupon does not exist or does not belong to the user.
  - Coupon status is not `active`.
  - Current time is past `expires_at`.

---

## 23. Notification System (v1: Order Confirmation Email Only)

v1 scope is deliberately minimal. WhatsApp is v1.1; coupon expiry reminders are v1.1.

### Order Confirmation Email
- **Trigger:** Fired inside the PhonePe callback handler, once `payment_status` is confirmed `paid` (first-time processing only — `processed=true` check prevents duplicate emails on callback retries)
- **Provider:** Nodemailer + AWS SES (recommended). Alternatively Resend or Brevo.
- **Content:** Order ID, item list (name, variant, quantity, price), shipping fee (₹99), total, estimated delivery, shipping address, link to order detail page

---

## 24. Animations & Micro-interactions

General principle: **short durations, ease-out, no bounce/elastic** — matches premium eyewear brand tone.

### Product Card Scroll Reveal
- Fade in + slide up ~20px, 400–500ms, `ease-out`
- Stagger: 100–120ms between cards in a row
- `IntersectionObserver` trigger — animate once, not on every scroll re-entry
- Framer Motion (`whileInView`) recommended; plain CSS `@keyframes` + IO hook is a valid no-dependency alternative

### "View Collection ->" Hover
- Arrow nudges right ~4px + underline draws left-to-right
- 150–200ms, `ease-out`, pure CSS (`transform` + pseudo-element `width`)

### Brand Statement Mid-Scroll
- Simple fade-in only (no slide), 600ms `ease-in-out` — feels reflective, not transactional

### Rules
- `prefers-reduced-motion`: wrap all animations, disable or shorten for users who have this set
- Never gate functionality behind animation completing
- Consistent easing: `ease-out` for entrances, `ease-in-out` for state changes
- Animate `transform` and `opacity` only — GPU-accelerated, smooth on mid-range phones

---

## 25. Inventory Concurrency & Stock Reservation

**Problem:** Two customers check out the last unit simultaneously. Without locking, both payments could succeed while only one unit exists.

### Strategy

1. On `POST /orders`: backend creates `stock_reservations` rows and decrements `product_variants.stock` inside a single DB transaction with `SELECT ... FOR UPDATE` (row-level lock). If stock is insufficient, the order is rejected immediately.
2. Reservation window: 10 minutes — covers a normal PhonePe checkout with buffer.
3. Payment success: reservation → `fulfilled`, decrement is permanent.
4. Payment failure/timeout: `node-cron` job (runs every 5 minutes) scans for reservations past `expires_at` with `status='active'`, releases them (increments stock back, marks released).
5. Why a DB transaction: Application-level checks without `FOR UPDATE` allow two simultaneous reads of "1 in stock" before either writes — a classic race condition. The transaction + lock prevents this.

### Edge Case
If a reservation expires mid-payment and payment succeeds after expiry, stock may already be gone. The callback handler re-checks stock before confirming. If stock is zero: system-initiated refund (`initiated_by='system'`), customer notified by email. Rare given 10-minute window, but documented.

---

## 26. Error Response Contract

All error responses use a consistent shape. Frontend switches on `error.code` (machine-readable), not `error.message`.

```json
{
  "error": {
    "code": "MACHINE_READABLE_CODE",
    "message": "Human-readable, for logs only -- not shown verbatim to users",
    "details": []
  }
}
```

### Standard Error Codes

| HTTP Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body/params fail schema validation |
| 401 | `UNAUTHENTICATED` | No token or token expired |
| 401 | `INVALID_CREDENTIALS` | Wrong email/password |
| 403 | `FORBIDDEN` | Authenticated but not authorized |
| 404 | `NOT_FOUND` | Resource does not exist |
| 404 | `PRODUCT_NOT_FOUND` | Slug does not match any active product |
| 409 | `EMAIL_ALREADY_EXISTS` | Duplicate email on registration |
| 422 | `OUT_OF_STOCK` | Variant stock insufficient |
| 422 | `VARIANT_UNAVAILABLE` | Variant is soft-deleted |
| 422 | `ORDER_NOT_CANCELLABLE` | Order is past pending state for self-service cancel |
| 429 | `RATE_LIMITED` | Too many requests (includes `Retry-After` header) |
| 500 | `INTERNAL_ERROR` | Unexpected server error (full stack logged server-side, generic message to client) |

### Validation Details

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "issue": "invalid_format", "message": "Must be a valid email address" },
      { "field": "quantity", "issue": "min_value", "message": "Must be at least 1" }
    ]
  }
}
```

Implementation: Centralized Express error middleware. Controllers throw `new AppError('OUT_OF_STOCK', 422, '...')`. Middleware serializes all errors consistently.

---

## 27. Logging & Observability Strategy

### Logger: pino
- Structured JSON output — parseable by AWS CloudWatch Logs (natural choice given AWS hosting)
- `pino-pretty` in development for human-readable colorized output
- No `console.log` in production code

### What to Log

| Level | What | Example |
|---|---|---|
| `info` | Every request (method, path, status, duration, requestId) | `{ method:"POST", path:"/api/v1/orders", status:201, ms:142 }` |
| `info` | Payment lifecycle | `{ event:"payment_initiated", orderId:"...", amount:2549 }` |
| `info` | Payment callback received | `{ event:"payment_callback", merchant_transaction_id:"...", status:"success" }` |
| `warn` | Callback checksum failure | `{ event:"checksum_failed", merchant_transaction_id:"...", ip:"..." }` |
| `warn` | Duplicate callback (no-op) | `{ event:"duplicate_callback", merchant_transaction_id:"...", processed:false }` |
| `warn` | Stock reservation released | `{ event:"reservation_released", orderId:"...", variantId:"..." }` |
| `warn` | Rate limit hit | `{ event:"rate_limited", ip:"...", path:"/auth/login" }` |
| `error` | Unhandled exceptions | Full stack trace + requestId |
| `error` | Order confirmation email failure | `{ event:"email_failed", orderId:"...", reason:"..." }` |

### What NOT to Log
- Passwords, plaintext tokens, OTPs
- PhonePe salt keys or merchant secrets
- Full phone numbers (mask as `****5678`)

### Request ID Tracing
- Middleware generates a UUID `requestId` for every request
- Attached to every log line within that request lifecycle
- Returned in `X-Request-Id` response header for bug reports

### AWS CloudWatch Setup
- Backend logs go to CloudWatch Logs via stdout capture (ECS log driver or EC2 CloudWatch agent)
- Set up a log metric filter on `"event":"payment_checksum_failed"` — alert if this fires in production
- Log level: `info` in production, `debug` in development (`LOG_LEVEL` env var)

---

## 28. Refunds & Cancellations

### Cancellation Rules

| Scenario | Who | What happens |
|---|---|---|
| `payment_status='pending'` | Customer, self-service | Order `fulfillment_status → cancelled`, stock reservations released, no refund (no payment captured) |
| `payment_status='paid'`, `fulfillment_status='unfulfilled'` | Customer requests via same endpoint | Creates a refund request in `refunds` table — admin approves/rejects |
| `fulfillment_status='shipped'` or `'delivered'` | Not self-service | Must contact support (return policy page); out of scope for v1 |

### Refund Processing
- All refunds are admin-approved — no automatic refund-on-request for paid orders (manual checkpoint against fraud in early weeks)
- Admin approves → `POST /admin/orders/:id/refund` → PhonePe Refund API call → `refunds.status='initiated'`
- PhonePe webhook/status check updates to `completed` or `failed`
- On `completed`: `orders.payment_status → refunded`
- Partial refunds supported by schema; v1 admin UI implements full-order refunds only

### Out-of-Stock-After-Payment Edge Case
System-initiated refund: `initiated_by='system'`, `reason='Out of stock after payment expiry'`. Triggers an email to customer explaining the situation — not a silent refund. See Section 25.

### Out of Scope for v1
- Customer-facing return/exchange UI for delivered items
- Automated refund approval
- Partial-item return UI (schema supports it; UI deferred)

---

## 29. Pre-Build Decision Checklist (Final)

All decisions are now resolved. This table is the record.

| # | Decision | Resolution |
|---|---|---|
| 1 | Coupon/referral system | ✅ **DEFERRED TO v1.1** — detailed specs finalized in Section 22, database schema pre-planned in Section 7 |
| 2 | Shipping fee | ✅ **Flat ₹99** per order, stored on the order at creation |
| 3 | GST basis | ✅ **GST-inclusive display prices** — `orders.tax_amount = 0` at checkout |
| 4 | Auth strategy | ✅ **Email + password (primary)** for v1; WhatsApp OTP in v1.1 via client business phone |
| 5 | Variant attributes | ✅ **All fields nullable** — admin leaves irrelevant fields blank per product |
| 6 | Return/cancellation policy | ⚠️ **Placeholder static page** until client provides final copy |
| 7 | Hosting & Server Security | ⚠️ **Client Team Job** — They will manage hosting infrastructure (AWS, domain, DB maintenance, security policies). We deliver tested code. |
| 8 | Email provider | ✅ **AWS SES** (recommended, same account) — Resend/Brevo as fallback |
| 9 | OTP routing | ✅ **Email-first for v1**; business phone WhatsApp OTP in v1.1 |
| 10 | Catalog size | ✅ **Small catalog** — no bulk import needed, admin panel sufficient |

> Only items 6 and 7 remain pending, and neither blocks starting the build. Item 6 only blocks policy page content. Item 7 only blocks the final deployment step in Week 4.
