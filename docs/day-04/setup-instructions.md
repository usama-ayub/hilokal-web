# Day 04: Setup & Execution Instructions

Follow these steps to run and verify the **Day 04 (LiveKit Audio Infrastructure & Signaling)** deliverables.

---

## Prerequisites
* **Docker Desktop** running with MongoDB, Redis, and LiveKit containers active.
* **Node.js** (v18.18+ or v20+).
* Microphone permissions allowed in your web browser.

---

## Step 1: Ensure Docker Services Are Running
In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
docker compose up -d
```

Verify that all three services are running:
* `mongo:latest` (Port 27017)
* `redis:alpine` (Port 6379)
* `livekit/livekit-server:latest` (Ports 7880, 7881, 7882/udp)

---

## Step 2: Start the Development Server
In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
npm run dev
```

Open your browser to:
```text
http://localhost:3000
```

---

## Step 3: Test and Verify Day 4 Deliverables

### 1. Ensure You Are Signed In:
* If not already signed in, go to the **Day 3 Milestone** panel and click **"Create Free VIP Account"** or **"Sign In & Start Heartbeat"**.

### 2. Create an Audio Table:
* In the **Day 4 Milestone: LiveKit Audio Infrastructure & Signaling** panel:
  * Enter a room title (e.g. `Spanish & English Cafe ☕`).
  * Select a language (e.g. `Spanish (ES)`).
  * Click **"Host Audio Table"**.
* **What happens behind the scenes:**
  1. MongoDB creates an active `Room` document with your user as the `hostId`.
  2. Redis initializes the room's speakers set (`room:{id}:speakers`) and metadata hash.
  3. LiveKit issues a signed WebRTC JWT token with `canPublish: true` and `roomAdmin: true`.
  4. The frontend connects to `ws://localhost:7880` via WebRTC in under 100ms.
  5. The stage controller appears showing you on the speaker stage with a microphone control!

### 3. Test Microphone Muting & Audio Capture:
* Click **"Unmute Mic"**.
* Your browser will ask for microphone permissions (click **Allow**).
* Notice the indicator changes to **"Mute Mic (Speaking Live)"** with a green active badge.
* LiveKit captures and transmits your audio stream to the SFU server.

### 4. Test Multi-User Stage & FIFO Hand-Raise Queue:
* Open an **Incognito / Private Window** in your browser and go to `http://localhost:3000`.
* In the incognito window, create a second user account (e.g. `learner_sofia`).
* Under **Active Live Tables**, click **"Join Table"** on the table you created in Step 2.
* Notice that `learner_sofia` joins as an **Audience Listener** (`canPublish: false`).
* Click **"Raise Hand to Speak"**:
  * Redis executes `ZADD room:{id}:hand_raise_queue <timestamp> <userId>`.
  * The button updates to show your exact position: **`Hand Raised (#1 in FIFO Queue)`**!
* Switch back to your host window:
  * The host can click **"Promote"** next to the user.
  * The user is atomically moved from the Redis queue to the speakers set and granted LiveKit WebRTC publishing permissions!

### 5. Test Leaving & Ending the Stage:
* A speaker or listener can click **"Leave Table"** to exit cleanly.
* The host can click **"End Table"**:
  * MongoDB marks the room as `status: "ended"`.
  * Redis flushes all ephemeral room keys (`cleanRoomState`).
  * LiveKit deletes the SFU room.
