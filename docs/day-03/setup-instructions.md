# Day 03: Setup & Execution Instructions

Follow these steps to run and verify the **Day 03 (Authentication & User Presence Engine)** deliverables.

---

## Prerequisites
* **Docker Desktop** running on Windows.
* **Node.js** (v18.18+ or v20+).

---

## Step 1: Ensure Docker Services Are Running
Ensure your 3 local services (MongoDB, Redis, LiveKit) are active. In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
docker compose up -d
```

Verify that all three containers are healthy:
```powershell
docker ps
```

---

## Step 2: Start the Next.js Development Server
In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
npm run dev
```

The server will be accessible at:
```text
http://localhost:3000
```

---

## Step 3: Verify Day 3 Deliverables on the Web Dashboard
Open your browser and navigate to:
```text
http://localhost:3000
```

### 1. Test User Registration (Free VIP & 500 Coins):
* On the **Day 3 Milestone** panel, select **"Register New Learner (Free VIP)"**.
* The form will be prefilled with a demo learner (`learner_alex`, `alex@hilokal.test`, `password123`, English native, Spanish B1 target).
* Click **"Create Free VIP Account"**.
* **What happens behind the scenes:**
  1. The password is encrypted with 10 rounds of `bcryptjs`.
  2. MongoDB creates the `User` with `isVip: true` and `coinsBalance: 500`.
  3. `UserLanguage` documents are created for English (native) and Spanish B1 (learning).
  4. An `initial_signup` transaction of 500 coins is logged in `CoinTransaction`.
  5. Redis sets key `presence:user:<id>` to `"online"` with a 60-second sliding TTL.
  6. An HTTP-only JWT cookie (`hilokal_auth_token`) is stored in your browser.
  7. The UI immediately displays the authenticated profile card with a pulsing green online indicator and Free VIP Crown!

### 2. Verify Redis In-Memory Presence Heartbeat:
* Notice the pulsing green dot next to the user's avatar.
* Click **"Query Redis Presence"**:
  * The frontend queries `/api/presence/status?userId=<id>`.
  * Redis confirms that the user is currently `online: true` with a sliding 60-second TTL.
  * In the background, `<PresenceHeartbeat />` transmits a ping every 30 seconds to keep the session alive.

### 3. Verify Session Persistence Across Page Refreshes:
* Refresh your browser page (`F5`).
* Notice that you remain logged in! The Zustand store automatically calls `/api/auth/me`, validating your HTTP-only cookie and loading your profile instantly.

### 4. Test Sign Out & Redis Presence Invalidation:
* Click **"Sign Out"** in the header or profile card.
* **What happens:**
  1. `/api/auth/logout` is called.
  2. The HTTP-only auth cookie is expired (`maxAge: 0`).
  3. The Redis presence keys are immediately purged via `setUserOffline()`.
  4. The UI returns to the guest registration/login form.

### 5. Test User Login:
* Select **"Sign In Existing Learner"**.
* Enter `alex@hilokal.test` and `password123`.
* Click **"Sign In & Start Heartbeat"**.
* You will be authenticated immediately.
