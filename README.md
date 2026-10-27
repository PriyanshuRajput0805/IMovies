# 🎬 IMovies – Full-Stack Cinema Management & Online Movie Ticket Booking Platform

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-orange.svg)](https://mongodb.com)
[![Node.js](https://img.shields.io/badge/Node.js-v24.16-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io)
[![Tests](https://img.shields.io/badge/Tests-48%20Passed-brightgreen.svg)](https://jestjs.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**IMovies** is a production-grade, highly scalable, and secure full-stack cinema management and online movie ticket booking platform built with the modern MERN stack (MongoDB Atlas, Express.js, React 19, Node.js v24). It features **authoritative real-time seat availability**, **concurrency-safe seat reservation (zero double-booking)**, payment processing via **Razorpay** (with zero-friction mock fallback), **dynamic digital QR passes**, and a full-featured **administrative command center**.

---

## 🌟 Key System Capabilities

- **Zero Double-Booking Guarantee:** Compound unique indexes (`{ showId: 1, seatIdentifier: 1 }`) on `SeatLock` and `BookedSeat` collections prevent race conditions at the MongoDB engine layer, verified by automated parallel stress tests.
- **10-Minute Lease Countdown:** Temporary seat reservations automatically expire and release via MongoDB TTL indexes and client-side countdown timers.
- **Real-Time WebSocket Synchronization:** Live seat state broadcasts (`seats_locked`, `seats_unlocked`, `seats_booked`) push instantly to all connected viewers in a specific show room using Socket.IO.
- **Auditorium Scheduling & Overlap Prevention:** Mathematical scheduling conflict detection ensures no two shows can be booked on the same screen within running time + 15-minute turnaround.
- **Secure Authentication & RBAC:** Dual-token JWT (1-day access, 7-day refresh) with bcrypt hashing (12 salt rounds), rate limiting, and role-based permissions (`admin` vs `user`).
- **Payments & Instant Checkout:** Razorpay order creation and HMAC SHA-256 signature verification alongside a 1-click test checkout mode for instantaneous demo testing.
- **Digital QR Tickets:** High-contrast QR passes generated dynamically using SVG for offline scanner validation at cinema turnstiles.
- **Accessible Dark Cinema UI:** Premium dark theme styled with custom CSS variables, responsive Bootstrap 5 grids, and full ARIA accessibility tags.

---

## 🏛️ Architecture Overview

```
IMovies Monorepo
│
├── backend/                  # Express REST API & Socket.IO Engine
│   ├── src/
│   │   ├── config/           # Database connection, Atlas SRV resolver, env variables
│   │   ├── controllers/      # Auth, Movies, Theatres, Screens, Shows, Bookings, Payments
│   │   ├── middlewares/      # Error handler, rate limiters, JWT & RBAC
│   │   ├── models/           # User, Movie, Theatre, Screen, Show, SeatLock, BookedSeat, Booking
│   │   ├── routes/           # REST endpoints (/api/v1/...)
│   │   ├── services/         # Seat locking, schedule conflicts, payments
│   │   ├── sockets/          # WebSocket event broadcaster (show rooms & user rooms)
│   │   ├── tests/            # 48 Automated unit, integration & concurrency tests
│   │   └── utils/            # Logger, ApiResponse, ApiError, Atlas seeder
│   └── package.json
│
├── frontend/                 # React 19 + Vite 6 Single Page Application
│   ├── src/
│   │   ├── components/       # Common (Header, Footer, Health), Movies, Theatres
│   │   ├── features/         # Redux Toolkit store & auth slice
│   │   ├── pages/
│   │   │   ├── admin/        # Comprehensive Admin Dashboard (Movies, Theatres, Shows)
│   │   │   ├── auth/         # Login & Register views
│   │   │   ├── booking/      # SeatSelectionPage, CheckoutPage, BookingConfirmationPage
│   │   │   ├── movies/       # MovieDiscoveryPage, MovieDetailsPage
│   │   │   ├── profile/      # ProfilePage, BookingHistoryPage
│   │   │   ├── theatres/     # TheatresPage, TheatreDetailsPage
│   │   │   └── HomePage.jsx  # Hero spotlight, trending carousel, quick booking bar
│   │   ├── services/         # Axios API client & Socket.IO client
│   │   ├── index.css         # Cinema design system & seat grid styling
│   │   └── App.jsx           # Client-side router configuration
│   └── package.json
│
├── docker-compose.yml        # Production multi-container orchestration
└── package.json              # Monorepo task orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v24.x recommended)
- **MongoDB:** MongoDB Atlas cluster or local instance (`mongodb://127.0.0.1:27017/imovies`)
- **npm:** v9.x or higher

### 2. Environment Configuration
Verify root `.env` or `backend/.env`:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@chat-db.8ywxpr8.mongodb.net/imovies?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_ACCESS_SECRET=imovies_super_secure_jwt_access_secret_2026_key
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_SECRET=imovies_super_secure_jwt_refresh_secret_2026_key
JWT_REFRESH_EXPIRY=7d
SEAT_LOCK_EXPIRY_MINUTES=10
RAZORPAY_KEY_ID=rzp_test_imovies_mock_key
RAZORPAY_KEY_SECRET=rzp_test_imovies_mock_secret
```

### 3. Install Dependencies
```bash
# In the root repository directory:
npm run install:all
```

### 4. Seed Database (Movies, Multiplexes, Screens & Shows)
```bash
cd backend
npm run seed
```
*Seeds 6 blockbuster titles, 4 flagship multiplexes across Mumbai & Delhi, 8 screens, and 72 scheduled screenings.*

### 5. Launch Full Platform (Concurrent Backend & Frontend)
```bash
# In the root directory:
npm run dev
```
- **Backend API:** `http://localhost:5000` (Diagnostics: `http://localhost:5000/api/v1/health`)
- **Frontend App:** `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@imovies.com` | `Admin@123456` | Full CRUD over Movies, Theatres, Screens, and Schedules |
| **Customer** | `customer@imovies.com` | `Customer@123456` | Browse films, reserve seats, checkout, cancel reservations |

---

## 🧪 Automated Test Suite (48 / 48 Tests Passed)

The platform includes exhaustive integration and concurrency tests covering all functional phases:

```bash
cd backend
npm test
```

### Test Coverage Summary:
- **`health.test.js`** (4 tests): Health diagnostics, ping, 404 handler.
- **`auth.test.js`** (11 tests): Registration, duplicate rejection, login, JWT verification, profile update, password change, RBAC enforcement.
- **`cinema.test.js`** (11 tests): Movies pagination, genre filtering, admin movie creation, theatre query, screens with layouts, conflict detection, 15-minute turnaround enforcement.
- **`booking.test.js`** (10 tests): Seating availability layout, 10-minute seat locking, concurrency double-lock rejection (409 Conflict), release seat locks, user booking retrieval.
- **`payment.test.js`** (9 tests): Order creation, HMAC signature verification, mock checkout fallback, double-booking prevention, booking cancellation.
- **`concurrency.test.js`** (2 tests): **High-concurrency parallel race-condition stress test** asserting that when 5 users simultaneously request the exact same seat at the exact same millisecond, exactly 1 succeeds and 4 receive 409 Conflict.

---

## 📡 REST API Reference (`/api/v1`)

### Authentication & Profiles (`/auth`)
- `POST /api/v1/auth/register` – Create customer account
- `POST /api/v1/auth/login` – Authenticate and receive JWT access & refresh tokens
- `GET /api/v1/auth/me` – Fetch current user profile
- `PATCH /api/v1/auth/profile` – Update name or phone number
- `PUT /api/v1/auth/change-password` – Change password with current password verification

### Movies & Theatres (`/movies`, `/theatres`, `/shows`)
- `GET /api/v1/movies` – List movies with pagination, search, genre, and language filters
- `GET /api/v1/movies/:id` – Fetch movie synopsis, cast, ratings, and active schedules
- `POST /api/v1/movies` – Create new movie *(Admin only)*
- `GET /api/v1/theatres` – List theatres filtered by city
- `GET /api/v1/theatres/:theatreId/screens` – List screens with row seating configurations
- `GET /api/v1/shows` – Query shows by movie, theatre, and date
- `POST /api/v1/shows` – Schedule show with conflict overlap validation *(Admin only)*

### Seating & Bookings (`/shows/:id/seats`, `/bookings`)
- `GET /api/v1/shows/:id/seats` – Real-time seating matrix with availability states
- `POST /api/v1/bookings/lock-seats` – Temporarily hold seats for 10 minutes
- `POST /api/v1/bookings/unlock-seats` – Release temporarily held seats
- `GET /api/v1/bookings/my-bookings` – Retrieve authenticated user's booking history
- `GET /api/v1/bookings/:id` – View individual booking pass details
- `POST /api/v1/bookings/:id/cancel` – Cancel reservation and release seats

### Payments & Checkout (`/payments`)
- `POST /api/v1/payments/create-order` – Create Razorpay or Mock payment order
- `POST /api/v1/payments/verify` – Verify HMAC SHA256 signature and confirm booking
- `POST /api/v1/payments/mock-checkout` – 1-Click instant test checkout

---

## ⚡ Socket.IO Event Schema

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join_show` | Client ➔ Server | `showId` | Joins the room for that screening schedule |
| `leave_show` | Client ➔ Server | `showId` | Leaves the screening schedule room |
| `seats_locked` | Server ➔ Room | `{ showId, seats, lockedUntil, lockedBy }` | Updates seat color to locked in real time |
| `seats_unlocked` | Server ➔ Room | `{ showId, seats }` | Updates seat color back to available |
| `seats_booked` | Server ➔ Room | `{ showId, seats }` | Marks seats as sold out permanently |

---

## 🐳 Docker Deployment

To launch the entire platform in isolated production containers:

```bash
docker compose up --build -d
```
The application will be live at:
- Frontend Web App: `http://localhost:80`
- Backend API: `http://localhost:5000`

---

## 🛡️ Security & Reliability Implementations
1. **SRV DNS Workaround for Windows:** Automated fallback to Google Public DNS (`8.8.8.8`) ensures reliable resolution of MongoDB Atlas SRV connection strings on all Windows environments.
2. **Helmet Security Headers & CORS Protection:** Restricts cross-origin requests and prevents clickjacking and MIME-type sniffing.
3. **Multi-Tier Rate Limiting:** Separate rate limiters for general API calls (300/15min), authentication endpoints (30/15min), and booking/payment transactions (50/5min) to prevent brute-force attacks and reservation spam.
4. **Input Sanitization & Schema Validation:** Enforces strict boundary checks on all dates, ticket quantities (1 to 8 max per transaction), and show durations.

---

*Developed with ❤️ as a full-stack cinema management showcase.*
