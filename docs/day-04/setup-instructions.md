# Day 04: Setup & Execution Instructions

Follow these steps to run and verify the **Day 04 (LiveKit Audio Infrastructure & Signaling)** deliverables, including the audio transmission and hand-raise fixes.

---

## Prerequisites
* **Docker Desktop** running with MongoDB, Redis, and LiveKit containers active.
* **Node.js** (v18.18+ or v20+).
* Microphone permissions allowed in your web browser.

---

## Step 1: Restart Docker Services with WebRTC Local Host IP
To ensure LiveKit advertises `127.0.0.1` (localhost) rather than Docker's internal container IP, run:

```powershell
cd "D:\Project\Hilokal Clone"
docker compose up -d
```

Verify that all three services are running:
* `mongo:latest` (Port 27017)
* `redis:alpine` (Port 6379)
* `livekit/livekit-server:latest` (Ports 7880, 7881, 50000-50050/udp) with `--node-ip 127.0.0.1`

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

## Step 3: Test and Verify Audio & Hand-Raise Queue

### 1. Host Creates the Audio Table:
* In your normal browser window, ensure you are signed in as Host (e.g. `learner_alex`).
* In the **Day 4 Milestone: LiveKit Audio Infrastructure & Signaling** panel:
  * Click **"Host Audio Table"**.
* You will join as **HOST** with green LiveKit indicator: `WebRTC Connected (127.0.0.1)`.
* Click **"Unmute Mic"** and click **Allow** on the browser permission prompt. The button changes to green: **"Mute Mic (Speaking Live)"**.

### 2. Learner Joins and Raises Hand (Incognito Window):
* Open an **Incognito / Private Window** in your browser and visit `http://localhost:3000`.
* In the Day 3 panel, click **Register New Learner** and create a second account (e.g. `learner_sofia`, `sofia@test.com`).
* Scroll to the Day 4 panel and click **"Join Table"** on the table created in Step 1.
* Sofia joins as **AUDIENCE LISTENER** (`activeRole: "listener"`).
* Sofia clicks **"Raise Hand to Speak"**:
  * The button animates in amber: **`Hand Raised (#1 in FIFO Queue)`**.

### 3. Verify Host Sees Hand-Raise Instantly:
* Switch back to the **Host's browser window**.
* Notice the prominent **"Hand-Raise Requests (FIFO Queue)"** card is now visible:
  * Shows `🔔 Hand-Raise Requests (1 in FIFO Queue)`.
  * Shows `@learner_sofia` with `#1` priority badge.
  * Shows green **"Promote to Speaker 🎤"** button and **"Dismiss"** button.

### 4. Promote Learner & Test Real-Time Audio:
* In the Host window, click **"Promote to Speaker 🎤"**.
* In Sofia's Incognito window:
  * Her role immediately updates from `listener` to **`speaker`**!
  * An alert appears: *"🎉 You have been promoted to Speaker! Unmute your mic to speak."*
  * The **"Unmute Mic"** button appears!
* Sofia clicks **"Unmute Mic"** (allowing browser mic).
* Both users are now speaking live over WebRTC sub-100ms audio! Speaking indicators pulse around active avatars.

### 5. Leaving & Ending the Stage:
* Sofia can click **"Leave Table"** to exit back to the lobby.
* The host can click **"End Table"** to purge Redis keys and terminate the LiveKit SFU room.
