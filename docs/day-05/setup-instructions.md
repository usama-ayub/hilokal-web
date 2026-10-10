# Day 05: Setup & Execution Instructions

Follow these instructions to run and verify the **Day 05 (In-Room Live Interactive Engagement & Free Virtual Gift Economy)** deliverables.

---

## Prerequisites
* **Docker Desktop** running with MongoDB, Redis, and LiveKit containers active.
* **Node.js** (v18.18+ or v20+).
* Two browser windows (e.g. Normal window and Incognito window) to simulate peer-to-peer live interactions.

---

## Step 1: Ensure Docker Services Are Running
In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
docker compose up -d
```

---

## Step 2: Start the Next.js Development Server
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

## Step 3: Test and Verify Day 5 Features

### 1. Set Up Two Users in a Live Room:
* **Window 1 (User A - Host):**
  * Sign in or register as `learner_alex`.
  * Click **"Host Audio Table"** in the Day 4 panel.
* **Window 2 (User B - Speaker):**
  * In an Incognito window, register a second learner (e.g. `learner_sofia`).
  * In the Day 4 panel, click **"Join Table"**.
  * User B clicks **"Raise Hand to Speak"**.
  * In Window 1, Host clicks **"Promote to Speaker 🎤"**.
  * Both users are now active on stage!

---

### 2. Test In-Room Live Chat:
* In Window 2 (Sofia), click the **"Live Chat & Corrections"** tab under the stage.
* Type a message: `"Hello everyone, happy to practice Spanish today!"` and click **Send**.
* **Verify in Window 1 (Alex):**
  * The message appears in real-time in the feed with Sofia's name, avatar, and Free VIP badge!

---

### 3. Test Structured Language Corrections:
* In Window 1 (Alex - Host / Tutor), click the **"Language Correction"** button in the composer.
* Fill in the 3 fields:
  * **Original heard:** `"Yo tiene dos amigos"`
  * **Better phrasing:** `"Yo tengo dos amigos"`
  * **Grammar tip:** `"Use 'tengo' for first person singular (yo) in present tense."`
* Click **"Post Correction"**.
* **Verify in Both Windows:**
  * The correction renders in an amber highlighted card with:
    * 🔴 Original: *"Yo tiene dos amigos"* (strikethrough)
    * 🟢 Natural phrasing: *"Yo tengo dos amigos"*
    * 💡 Tip: *"Use 'tengo' for first person singular (yo) in present tense."*

---

### 4. Test Complimentary Free Virtual Gifts:
* In Window 1 (Alex), click the **"Send Free Virtual Gift 🎁"** tab.
* In **Section 1 (Select Recipient)**: Click on **Sofia**.
* In **Section 2 (Choose Gift)**: Select **🌹 Red Rose (50 Coins)**.
* Click **"Send Free Gift 🎁"**.
* **Verify the Real-Time Double-Entry Effect:**
  1. Alex's coins balance immediately decreases by 50 coins (e.g. 500 ➔ 450).
  2. A floating celebration banner appears across both screens:
     * *🌹 Alex sent a Red Rose to Sofia!*
  3. A gift announcement is added to the in-room chat feed.
  4. In Window 2 (Sofia), her coins balance increases by 50 coins (e.g. 500 ➔ 550)!

---

### 5. Verify Coin Ledger & Transaction Audit:
* Click the **"Coin Ledger & Free VIP Perks"** tab.
* Inspect the transaction audit history:
  * Shows initial signup bonus: `+500 Coins`
  * Shows daily streak bonus: `+500 Coins`
  * Shows sent/received gift transaction entries with exact timestamps and updated balances.
