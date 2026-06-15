<div align="center">

# ⚡ LinkPulse

### Smart Link Management & Analytics Platform

**Shorten. Track. Analyse. All in one place.**

[![Node.js](https://img.shields.io/badge/Node.js-≥18.0-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Authentication](#-authentication)
- [Security](#-security)
- [Deployment](#-deployment)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**LinkPulse** is a full-stack, production-ready URL shortener and analytics platform built as a SaaS product. It lets users create short links, track every click in real time, and visualise traffic patterns through a modern dark-theme dashboard — all behind a secure JWT-based authentication system.

Whether you're a developer sharing project links, a marketer tracking campaign performance, or a business monitoring audience engagement, LinkPulse gives you the data you need in a clean, minimal interface.

> **Live Demo:** [https://url-shortener-bl1x.onrender.com](https://url-shortener-bl1x.onrender.com)  
> **API Base URL:** [https://linkpulse-backend-954s.onrender.com](https://linkpulse-backend-954s.onrender.com)

---

## ✨ Features

### 🔗 Link Management
- Create short URLs with auto-generated codes using `nanoid`
- Set custom aliases for branded short links
- Add optional expiry dates — links auto-deactivate after expiry
- Toggle links active/inactive without deleting them
- Favourite links for quick access
- QR code generation for every link
- Bulk link operations

### 📊 Analytics & Insights
- Real-time click tracking per link
- Per-visit metadata: browser, device type, OS, country (via User-Agent + IP)
- 14-day click trend area chart with Clicks vs Unique Clicks
- Top countries breakdown with animated progress bars and donut chart
- Device breakdown: Mobile / Desktop / Tablet / Other
- Browser analytics: Chrome, Safari, Firefox, Edge, Other
- Top performing links table with sortable columns (CTR, clicks, growth)
- Recent activity feed with live event types (created, clicked, expired, updated)

### 📈 Dashboard
- Animated stat cards: Total Clicks, Total Links, Active Links, Favourites
- All charts powered by Recharts with smooth animations
- Glassmorphism dark UI with purple ambient glow
- Skeleton loading states during data fetch
- Auto-refresh with manual refresh button

### 🔐 Authentication
- Secure JWT-based login and registration
- Password hashing with bcryptjs (10 salt rounds)
- Remember Me option for extended token expiry
- Protected routes on both frontend and backend
- Token stored in `localStorage`, validated on every protected API call

### 🛡️ Security
- Helmet.js for HTTP security headers
- CORS with explicit origin allowlist and preflight handling
- express-rate-limit with separate limiters for API and redirects
- express-mongo-sanitize to prevent NoSQL injection
- express-validator for all input validation
- Winston structured logging for audit trails

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool & dev server |
| Tailwind CSS | v4 | Utility-first styling |
| Framer Motion | 12 | Animations & transitions |
| Recharts | 3 | Data visualisation charts |
| React Router DOM | 7 | Client-side routing |
| Axios | 1 | HTTP client |
| Lucide React | 1 | Icon library |
| date-fns | 4 | Date formatting |
| react-hot-toast | 2 | Toast notifications |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | ≥18 | Runtime |
| Express | 4 | HTTP framework |
| MongoDB | — | Database |
| Mongoose | 8 | ODM |
| JSON Web Token | 9 | Authentication |
| bcryptjs | 2 | Password hashing |
| nanoid | 3 | Short code generation |
| Helmet | 7 | Security headers |
| CORS | 2 | Cross-origin requests |
| express-rate-limit | 7 | Rate limiting |
| express-validator | 7 | Input validation |
| express-mongo-sanitize | 2 | NoSQL injection prevention |
| Winston | 3 | Structured logging |
| qrcode | 1 | QR code generation |
| dotenv | 16 | Environment config |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│  React 19 + Vite + Tailwind CSS v4 + Framer Motion          │
│  Dashboard │ Links │ Analytics                               │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS  /api/*
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                         │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │   Auth   │  │  Links   │  │ Dashboard  │  │Analytics │  │
│  │  Routes  │  │  Routes  │  │  Routes    │  │  Routes  │  │
│  └──────────┘  └──────────┘  └────────────┘  └──────────┘  │
│                                                              │
│  Middleware: Helmet │ CORS │ Rate Limit │ Sanitize │ JWT     │
└────────────────────────┬────────────────────────────────────┘
                         │ Mongoose ODM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        MongoDB                               │
│   Users │ Links │ Visits                                     │
└─────────────────────────────────────────────────────────────┘
```

### Data Models

```
User           Link              Visit
─────────      ──────────────    ──────────────────
_id            _id               _id
name           user (ref)        link (ref)
email          title             visitedAt
password       originalUrl       ip
createdAt      shortCode         country
               shortUrl          device
               clickCount        browser
               isActive          os
               expiresAt         referrer
               isFavorite        userAgent
               createdAt
               updatedAt
```

---

## 📁 Project Structure

```
linkpulse/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app, CORS, middleware setup
│   │   ├── server.js              # Server bootstrap, graceful shutdown
│   │   ├── config/
│   │   │   └── database.js        # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── linkController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── analyticsController.js
│   │   │   └── redirectController.js
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification
│   │   │   ├── errorHandler.js
│   │   │   ├── rateLimiter.js
│   │   │   └── validate.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Link.js
│   │   │   └── Visit.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── linkRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   └── analyticsRoutes.js
│   │   ├── utils/
│   │   │   └── logger.js          # Winston logger
│   │   └── validators/
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/
    │   │   │   └── ProtectedRoute.jsx
    │   │   ├── layout/
    │   │   │   └── AppLayout.jsx  # Sidebar + TopNav
    │   │   ├── links/
    │   │   │   ├── CreateLinkModal.jsx
    │   │   │   └── QRModal.jsx
    │   │   └── ui/
    │   │       └── Skeletons.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── LinksPage.jsx
    │   │   ├── AnalyticsListPage.jsx
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   └── SignupPage.jsx
    │   ├── services/
    │   │   └── services.js        # Axios API client
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css              # Tailwind v4 + design tokens
    ├── .vscode/
    │   └── settings.json
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0 — [Download](https://nodejs.org)
- **MongoDB** — local install or [MongoDB Atlas](https://www.mongodb.com/atlas) free tier
- **npm** ≥ 9 (comes with Node.js)
- **Git**

---

### Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/linkpulse.git
cd linkpulse/backend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# → Edit .env with your values (see Environment Variables section)

# 4. Start development server (hot-reload with nodemon)
npm run dev

# The API will be available at http://localhost:5000
# Health check: http://localhost:5000/health
```

---

### Frontend Setup

```bash
# From the repository root
cd frontend

# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev

# The app will open at http://localhost:3000
# (Vite may use 3001, 3002 etc. if the port is busy)
```

> **Note:** Make sure the backend is running before starting the frontend. The frontend reads the API base URL from `VITE_API_URL` — see the Environment Variables section below.

---

## 🔧 Environment Variables

### Backend — `backend/.env`

```env
# Server
PORT=5000
NODE_ENV=development           # development | production

# Database
MONGODB_URI=mongodb://localhost:27017/linkpulse

# JWT
JWT_SECRET=your_super_secret_key_min_32_characters_long
JWT_EXPIRES_IN=7d              # e.g. 1d, 7d, 30d

# URLs
BASE_URL=http://localhost:5000           # Used to build short URLs
FRONTEND_URL=http://localhost:3000       # Primary allowed CORS origin

# Optional: additional CORS origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3002,https://your-production-frontend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000   # 15 minutes in ms
RATE_LIMIT_MAX=100            # Max requests per window per IP
```

### Frontend — `frontend/.env` (create if needed)

```env
VITE_API_URL=http://localhost:5000/api
```

> In production on Render/Vercel/Netlify, set `VITE_API_URL` to your deployed backend URL.

---

## 📡 API Reference

All protected routes require the `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | ❌ | Register a new user |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |

**POST `/api/auth/signup`**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**POST `/api/auth/login`**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "rememberMe": true
}
```

---

### Links

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/links` | ✅ | Get all links for the user |
| `POST` | `/api/links` | ✅ | Create a new short link |
| `GET` | `/api/links/:id` | ✅ | Get a single link by ID |
| `PUT` | `/api/links/:id` | ✅ | Update a link |
| `DELETE` | `/api/links/:id` | ✅ | Delete a link |
| `PATCH` | `/api/links/:id/toggle` | ✅ | Toggle active/inactive |
| `PATCH` | `/api/links/:id/favorite` | ✅ | Toggle favourite |
| `GET` | `/api/links/:id/qr` | ✅ | Generate QR code |

**POST `/api/links`**
```json
{
  "originalUrl": "https://example.com/very/long/url",
  "title": "My Link",
  "customCode": "my-link",        // optional
  "expiresAt": "2025-12-31"       // optional
}
```

---

### Dashboard

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard/summary` | ✅ | Stats: total clicks, links, active links |
| `GET` | `/api/dashboard/top-links` | ✅ | Top performing links (by click count) |
| `GET` | `/api/dashboard/recent-activity` | ✅ | Latest visit events |

---

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics/:linkId` | ✅ | Full analytics for a single link |

---

### Redirect

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/:shortCode` | ❌ | Redirect to original URL + record visit |

---

## 🔐 Authentication

LinkPulse uses **JWT Bearer token authentication**.

1. User registers or logs in via `/api/auth/signup` or `/api/auth/login`
2. The API returns a signed JWT
3. Frontend stores the token in `localStorage` under key `linkpulse_token`
4. Every subsequent API request sends: `Authorization: Bearer <token>`
5. The `auth.js` middleware verifies the token and attaches `req.user`
6. On app load, the frontend calls `/api/auth/me` to validate the stored token and restore the session

---

## 🛡️ Security

| Layer | Mechanism |
|---|---|
| **HTTP Headers** | `helmet()` — sets `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, etc. |
| **CORS** | Explicit origin allowlist + explicit `OPTIONS` preflight handler; `credentials: true` |
| **Rate Limiting** | 100 req/15 min on `/api/*`; separate stricter limiter on redirect `/:shortCode` |
| **NoSQL Injection** | `express-mongo-sanitize` strips `$` and `.` operators from all inputs |
| **Input Validation** | `express-validator` validates every field on auth and link routes |
| **Password Storage** | bcryptjs with 10 salt rounds — passwords are never stored in plaintext |
| **JWT Security** | Tokens signed with `HS256`; secret must be ≥32 characters |
| **Logging** | Winston logs all requests, CORS violations, and errors with timestamps |

---

## 🌐 Deployment

### Backend on Render

1. Push your code to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repository → select the `backend` root directory
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `npm start`
6. Add the following **Environment Variables** in Render's dashboard:

```
NODE_ENV=production
MONGODB_URI=<your MongoDB Atlas connection string>
JWT_SECRET=<your secure secret>
JWT_EXPIRES_IN=7d
BASE_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-frontend.onrender.com
ALLOWED_ORIGINS=https://your-frontend.onrender.com
```

### Frontend on Render / Netlify / Vercel

**Render Static Site:**
- Root directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

**Vercel:**
```bash
cd frontend
npx vercel --prod
# Set VITE_API_URL in Vercel project settings
```

**Netlify:**
```bash
cd frontend
npm run build
# Drag and drop the dist/ folder into Netlify, or connect via GitHub
```

> ⚠️ **Important:** After deploying the frontend, add its URL to `ALLOWED_ORIGINS` in your backend's Render environment variables — otherwise CORS will block all API requests.

---

## 📸 Screenshots

### Dashboard
The main dashboard provides an at-a-glance view of link performance with animated stat cards, a 14-day click analytics chart, top countries breakdown, and a live activity feed — all in a glassmorphism dark theme.

### Links Page
Manage all your short links from a searchable, filterable list. Create new links via a slide-in modal, copy URLs in one click, toggle active states, and open per-link analytics.

### Analytics Page
Dive deep into per-link analytics with click-over-time charts, referrer breakdown, device and browser distributions, and individual visit logs.

---

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m "feat: add amazing feature"

# 4. Push to the branch
git push origin feature/amazing-feature

# 5. Open a Pull Request
```

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Purpose |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code refactor (no feature/fix) |
| `style:` | UI/CSS changes |
| `docs:` | Documentation |
| `chore:` | Build, config, tooling |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using React, Node.js, and MongoDB

⭐ **If you find this project useful, please give it a star!** ⭐

</div>
