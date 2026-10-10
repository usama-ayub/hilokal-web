# Day 02: Setup & Execution Instructions

Follow these steps to run and verify the **Day 02 (Domain Data Models & Media Storage Pipeline)** deliverables.

---

## Prerequisites
* **Docker Desktop** running on Windows.
* **Node.js** (v18.18+ or v20+).

---

## Step 1: Start Docker Containers
Ensure your 3 local services (MongoDB, Redis, LiveKit) are active. In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
docker compose up -d
```

Verify that all three containers are healthy:
```powershell
docker ps
```

You should see:
* `mongo:latest` (`27017`)
* `redis:alpine` (`6379`)
* `livekit/livekit-server:latest` (`7880`, `7881`)

---

## Step 2: Start the Next.js Development Server
In your PowerShell:

```powershell
cd "D:\Project\Hilokal Clone"
npm run dev
```

The server will start at:
```text
http://localhost:3000
```

---

## Step 3: Verify Day 2 Deliverables on the Web Dashboard
Open your browser and navigate to:
```text
http://localhost:3000
```

### 1. Day 1 Health Status Cards:
Confirm that **MongoDB 7.0**, **Redis 7.2**, **Media Storage**, and **LiveKit SFU** all display green checkmarks.

### 2. Day 2 Mongoose Models Catalog:
Scroll to the **Day 2 Milestone** card. You will see all 7 domain models:
* `User` (Free VIP & 500 Coins)
* `UserLanguage` (CEFR A1-C2)
* `Room` (Audio Tables)
* `ScheduledTable` (Events & RSVP)
* `RoomMessage` (Chat & Corrections)
* `AiSummary` (Gemini Flashcards)
* `CoinTransaction` (Gift & Coin Ledger)

### 3. Test Seeding & MongoDB Writes:
Click the purple **"Seed Test Learner"** button on the dashboard:
* It will send a request to `/api/test-db` (POST).
* It will insert a demo user with `isVip: true` and `coinsBalance: 500`, 2 language preferences, an active practice room, and a 500-coin welcome transaction into MongoDB.
* A green confirmation card will appear showing the newly created user and room details, and document counts will update in real time!

### 4. Test Media Upload Pipeline:
In the **Media Storage Test Pipeline** section:
* Click **"Upload Test Image"** and choose any image from your computer (e.g. a PNG or JPG).
* The file will be uploaded to `/api/media/upload`, validated, and saved directly to `public/uploads/avatars/`.
* A green success banner will appear showing the public URL (e.g., `http://localhost:3000/uploads/avatars/1741...png`).
* Click the link to open and view the uploaded image in your browser!
