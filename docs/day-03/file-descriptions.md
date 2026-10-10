# Day 03: File Descriptions & Manifest

This document provides a comprehensive description of every file created or modified during the **Day 03 (Authentication & User Presence Engine)** milestone, explaining its role, internal technical specifications, and system interactions.

---

## 1. Security & Authentication Utilities

### `src/lib/auth.ts`
* **Role:** Centralized authentication, password hashing, and JWT token management helper.
* **Technical Details:**
  * Uses `bcryptjs` with 10 salt rounds (`hashPassword`, `verifyPassword`).
  * Uses `jsonwebtoken` to sign and verify stateless JWT tokens with payload `{ userId, username, email, isVip }`.
  * `getAuthUser(req)`: Dual extraction method that inspects both the `hilokal_auth_token` HTTP-only cookie and the standard `Authorization: Bearer <token>` header.
  * `setAuthCookie(res, token)`: Sets secure, `httpOnly: true`, `SameSite: "lax"`, 7-day cookie.
  * `clearAuthCookie(res)`: Purges cookie upon logout by setting `maxAge: 0`.
* **System Interaction:** Used by all protected API routes (`/api/auth/me`, `/api/auth/logout`, `/api/presence/heartbeat`, `/api/users/profile`).

---

## 2. In-Memory Presence Engine

### `src/lib/presence.ts`
* **Role:** High-speed in-memory state engine managing user online/offline status and current audio table tracking in Redis.
* **Technical Details:**
  * `setUserOnline(userId, activeRoomId?)`: Writes `presence:user:{userId}` with value `"online"` and a 60-second sliding TTL (`EX 60`). Optionally writes `user:{userId}:active_room`.
  * `setUserOffline(userId)`: Immediately deletes presence and room keys from Redis.
  * `getUserPresence(userId)`: Fetches online status and active room ID via Redis `MGET`.
  * `getMultiUserPresence(userIds)`: Performs O(1) multi-key pipeline lookup across all requested user IDs, ideal for rendering participant lists in active tables.
* **System Interaction:** Invoked by authentication routes, heartbeat pings, and room attendance services.

---

## 3. Authentication & Presence API Routes

### `src/app/api/auth/register/route.ts`
* **Role:** Handles new learner account creation.
* **Technical Details:**
  * Validates username length and email format.
  * Ensures username and email uniqueness in MongoDB.
  * Hashes password via `bcryptjs`.
  * Creates `User` with `isVip: true` (Free VIP) and `coinsBalance: 500`.
  * Creates default `UserLanguage` portfolio records for native and target languages.
  * Logs a 500-coin `initial_signup` record in `CoinTransaction`.
  * Sets user online in Redis, issues JWT, and returns HTTP-only cookie.
* **System Interaction:** Invoked by registration form on client.

---

### `src/app/api/auth/login/route.ts`
* **Role:** Authenticates existing users and applies daily login streak bonuses.
* **Technical Details:**
  * Matches credentials against MongoDB `User` collection.
  * Verifies password using `bcryptjs.compare`.
  * **Daily Streak & Reward Engine:** Evaluates calendar day change using UTC timestamps. If a new calendar day is detected, awards **+500 Free Coins**, increments `currentStreak`, and writes a `daily_login_bonus` transaction.
  * Sets `lastActiveAt: new Date()`.
  * Registers online presence in Redis and issues JWT cookie.
* **System Interaction:** Invoked by sign-in form on client.

---

### `src/app/api/auth/me/route.ts`
* **Role:** Returns authenticated session state.
* **Technical Details:**
  * Validates JWT from cookie or Bearer header.
  * Fetches `User` document, `UserLanguage` list, and real-time Redis presence status.
  * Returns user profile with sensitive `passwordHash` omitted.
* **System Interaction:** Invoked on initial page mount by Zustand auth store to restore persistent sessions.

---

### `src/app/api/auth/logout/route.ts`
* **Role:** Terminates active user session.
* **Technical Details:**
  * Clears `hilokal_auth_token` cookie.
  * Purges user presence keys from Redis via `setUserOffline()`.
* **System Interaction:** Invoked when user clicks "Sign Out".

---

### `src/app/api/presence/heartbeat/route.ts`
* **Role:** Background heartbeat receiver.
* **Technical Details:**
  * Accepts periodic POST pings (every 30 seconds).
  * Refreshes Redis 60-second sliding TTL for `presence:user:{userId}` and `user:{userId}:active_room`.
* **System Interaction:** Called continuously in the background by `<PresenceHeartbeat />`.

---

### `src/app/api/presence/status/route.ts`
* **Role:** Query endpoint for online statuses.
* **Technical Details:**
  * Supports `?userId=<id>` for single user status.
  * Supports `?userIds=<id1>,<id2>` for batch lookup using `getMultiUserPresence`.
* **System Interaction:** Used by UI to display green online indicator dots on participant avatars.

---

### `src/app/api/users/profile/route.ts`
* **Role:** Profile editing and language portfolio management.
* **Technical Details:**
  * `GET`: Fetches authenticated user's profile and languages.
  * `PUT`: Updates `displayName`, `bio`, `countryCode`, `avatarUrl`, `audioBioUrl`, and upserts `UserLanguage` documents.
* **System Interaction:** Invoked by learner profile settings and onboarding flows.

---

## 4. Client State & UI Components

### `src/store/useAuthStore.ts`
* **Role:** Global client-side state store powered by Zustand.
* **Technical Details:**
  * Maintains reactive state: `user`, `isAuthenticated`, `isLoading`, and `error`.
  * Provides asynchronous actions: `fetchMe()`, `login()`, `register()`, `logout()`, and `updateProfile()`.
* **System Interaction:** Consumed by React components across the application.

---

### `src/components/PresenceHeartbeat.tsx`
* **Role:** Headless background component that maintains the user's online status in Redis.
* **Technical Details:**
  * Sends an immediate heartbeat on mount.
  * Sets up a 30-second recurring `setInterval` to call `/api/presence/heartbeat`.
  * Cleans up timer when unmounted or when user logs out.
* **System Interaction:** Rendered at root level in `src/app/page.tsx` and application layout.

---

### `src/app/page.tsx`
* **Role:** Developer Dashboard & Milestone Verification UI.
* **Technical Details:**
  * Enhanced with **Day 3 Milestone: Authentication & Redis Presence Engine** panel.
  * Supports interactive user registration and sign-in testing.
  * Renders active user profile card with live VIP Crown, real-time Coin balance, active streak, and animated green Redis pulse indicator.
  * Includes button to directly query Redis presence status.
