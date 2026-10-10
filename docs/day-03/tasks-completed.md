# Day 03: Tasks Completed

## Summary of Accomplishments
Today, the **Authentication & Real-Time User Presence Engine** for **Hilokal Clone Web** was fully designed, implemented, and verified. The system now features secure JWT-based identity with password hashing via `bcryptjs`, automatic enrollment into the Free VIP tier and complimentary 500 Daily Coins economy, high-performance Redis sliding-window heartbeats (60s TTL), and full profile and language portfolio management.

---

### 1. Authentication Infrastructure (`src/lib/auth.ts`)
* **Password Hashing:** Integrated `bcryptjs` with 10 salt rounds for secure password hashing and constant-time verification.
* **Stateless JWT Tokens:** Built token generation and validation helpers signing user payload (`userId`, `username`, `email`, `isVip`) with configurable expiration (default 7 days).
* **HTTP-Only Secure Cookies:** Configured automated cookie dispatching (`hilokal_auth_token`) with `SameSite=lax` and `Path=/` to guard against XSS and CSRF token interception.
* **Dual Auth Extraction:** Authenticated API requests seamlessly inspect both the HTTP-only cookie and the `Authorization: Bearer <token>` header.

---

### 2. User Presence & Heartbeat Engine (`src/lib/presence.ts`)
* **Sliding TTL Heartbeat:** Implemented Redis key pattern `presence:user:{userId}` set to `"online"` with a 60-second sliding expiration (`EX 60`).
* **Active Room Tracking:** Implemented Redis key `user:{userId}:active_room` with matching 60s TTL, ensuring single-room participation per learner.
* **Batch Multi-User Status Lookups:** High-performance `mget` pipeline resolving online status and active room ID across dozens of users in O(1) time without querying MongoDB.
* **Instant Session Purge:** Immediate Redis key deletion upon manual sign-out (`setUserOffline`).

---

### 3. API Endpoints
* **Registration Endpoint (`src/app/api/auth/register/route.ts`):**
  * Validates alphanumeric username uniqueness and email format.
  * Creates `User` document with **100% Free VIP** default (`isVip: true`) and **500 Welcome Coins** (`coinsBalance: 500`).
  * Creates native and target `UserLanguage` documents with CEFR proficiency levels.
  * Records welcome bonus transaction in `CoinTransaction`.
  * Automatically sets user online in Redis and issues JWT cookie.
* **Login Endpoint (`src/app/api/auth/login/route.ts`):**
  * Accepts username or email with password verification.
  * **Daily Login Reward & Streak Engine:** Compares current login date against `lastActiveAt`. If a new calendar day is detected, awards **+500 Free Coins**, increments streak counter, and records a `daily_login_bonus` transaction.
  * Refreshes Redis presence and issues auth cookie.
* **Session Query (`src/app/api/auth/me/route.ts`):**
  * Returns authenticated user profile, coin balance, VIP status, language portfolio, and real-time Redis presence status.
* **Sign Out (`src/app/api/auth/logout/route.ts`):**
  * Clears the HTTP-only cookie and immediately removes user from Redis presence.
* **Presence Heartbeat (`src/app/api/presence/heartbeat/route.ts`):**
  * Receives 30-second ping from client, refreshing Redis 60s TTL.
* **Presence Batch Query (`src/app/api/presence/status/route.ts`):**
  * Query single user (`?userId=...`) or multiple comma-separated users (`?userIds=...`).
* **Profile Management (`src/app/api/users/profile/route.ts`):**
  * `GET`: Fetches complete profile and language portfolio.
  * `PUT`: Updates display name, bio, country code, avatar URL, audio bio URL, and CEFR language portfolio.

---

### 4. Client State Management & Interactive Dashboard
* **Zustand Auth Store (`src/store/useAuthStore.ts`):**
  * Reactive global store managing `user`, `isAuthenticated`, `isLoading`, `error`, `login`, `register`, `logout`, `fetchMe`, and `updateProfile`.
* **Headless Background Heartbeat (`src/components/PresenceHeartbeat.tsx`):**
  * Runs a 30-second recurring timer while authenticated, refreshing the Redis sliding TTL.
* **Dashboard Verification UI (`src/app/page.tsx`):**
  * Interactive Day 3 card allowing direct in-browser registration and login.
  * Live Profile display showing Free VIP Crown, real-time Coin balance, active streak, and animated green Redis pulse indicator.
