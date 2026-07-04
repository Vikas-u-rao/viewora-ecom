# VIEWORA — Developer Build & Setup Guide

Welcome to the **VIEWORA** development workspace. This guide outlines the steps to install, configure, verify, and run both the backend and frontend systems locally.

---

## 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x recommended)
- **PostgreSQL** (v15+ or running via Docker)
- **Git**
- A rest client such as **Postman** or the **Thunder Client** VS Code extension

---

## 2. Directory Structure
```
vieworaFolder/
├── PROJECT_BUILD_GUIDE.md   ← This document
├── README.md                 ← Root readme
├── e2e/                      ← Playwright E2E folder
└── server/                   ← Node.js/Express backend
    ├── prisma/
    │   └── schema.prisma    ← Database schema
    └── src/
        └── index.ts         ← Backend Entry point
```

---

## 3. Step-by-Step Setup

### Phase 1: Database Setup
If you do not have a PostgreSQL database server running locally, you can spin one up instantly using Docker:
```bash
docker run --name viewora-db -e POSTGRES_PASSWORD=viewora123 -e POSTGRES_DB=viewora -p 5432:5432 -d postgres:16
```
*This exposes a database connection at:* `postgresql://postgres:viewora123@localhost:5432/viewora`

---

### Phase 2: Backend Setup
1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install package dependencies:
   ```bash
   npm install
   ```
3. Set up your environment file:
   - Copy the template:
     ```bash
     cp .env.example .env.development
     ```
   - Open [.env.development](file:///c:/Users/vikas/work/viewora/vieworaFolder/server/.env.development) and configure your `DATABASE_URL` line:
     ```env
     DATABASE_URL="postgresql://postgres:viewora123@localhost:5432/viewora?schema=public"
     ```
4. Run database migrations to create the tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Start the backend server in development mode:
   ```bash
   npm run dev
   ```
   *The backend should load successfully on:* [http://localhost:5000](http://localhost:5000)  
   *Verify with health check:* [http://localhost:5000/health](http://localhost:5000/health)

---

### Phase 3: Frontend Setup
1. Open a new terminal window at the root:
   ```bash
   cd c:\Users\vikas\work\viewora\vieworaFolder
   ```
2. Create the Next.js React app using the configurations from the design doc:
   ```bash
   npx create-next-app@latest client --typescript --app --eslint --no-tailwind --src-dir=false --import-alias "@/*"
   ```
3. Navigate to the client folder and start the dev server:
   ```bash
   cd client
   npm run dev
   ```
   *The frontend will start running on:* [http://localhost:3000](http://localhost:3000)

---

## 4. Shared Workload Coordination

Since this is a shared workload between two developers, use this sequence to prevent blocking:

```
                  [ Day 1: Project Setup & DB Migrations ]
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
        [ Person A: Backend ]               [ Person B: Frontend ]
  Write Auth & Product APIs (Day 2-3)     Build Nav, Layout, Home UI (Day 2-3)
                  │                                   │
                  └─────────────────┬─────────────────┘
                                    ▼
                 [ Day 4-5: Cart & Product Detail UI Sync ]
                 Person A: Cart, Order APIs
                 Person B: Integrates Shop, Product details UI
                                    │
                                    ▼
                 [ Day 6-7: Dual Checkout & PhonePe sandbox ]
                 Both developers pair program on payment callbacks.
```

### Key Workload Guidelines:
- **API Contracts:** Use the endpoints defined in [API Endpoint Contract](file:///c:/Users/vikas/work/viewora/VIEWORA_Project_Documentation-v1.5.md#8-api-endpoint-contract) as the strict interface contract.
- **Frontend Mocks:** If the backend API endpoint isn't finished, the frontend developer should mock the response JSON in local components and switch to the live API URL once complete.

---

## 5. Build Verification Checklist

Verify your local builds with these tests before pushing to shared branches:
- [ ] **Health Check:** `GET http://localhost:5000/health` returns `{"status":"ok"}`.
- [ ] **Prisma Studio:** `npx prisma studio` opens DB interface without errors.
- [ ] **Database Connection:** DB tables match [schema.prisma](file:///c:/Users/vikas/work/viewora/vieworaFolder/server/prisma/schema.prisma).
- [ ] **JWT Key Verification:** `.env.development` contains unique keys for access and refresh tokens.
- [ ] **Cors Policy:** Requesting backend resources from origin `http://localhost:3000` does not trigger CORS violations.
