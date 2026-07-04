# VIEWORA — Premium Eyewear E-Commerce

## Project Structure
- `client/` — Next.js 14 App Router (Frontend)
- `server/` — Node.js + Express + Prisma (Backend)
- `e2e/` — Playwright end-to-end tests

## Quick Start

### Backend
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Environment Variables
Copy `.env.example` in `server/` and fill in your values.
