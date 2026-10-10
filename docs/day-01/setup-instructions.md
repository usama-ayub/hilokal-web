# Day 01: Setup & Execution Instructions

Follow these quick steps to spin up the local development infrastructure and run the Hilokal Clone Web application.

---

## Prerequisites
* **Docker Desktop** installed and running on Windows.
* **Node.js** (version 18.18+ or 20+ recommended).

---

## Step 1: Start Local Docker Services
Open your PowerShell or Command Prompt in the project folder:
```powershell
cd "D:\Project\Hilokal Clone"
docker compose up -d
```

### What this starts:
* **MongoDB:** `localhost:27017` (Database persistence)
* **Redis:** `localhost:6379` (In-memory presence, audio state & hand-raise queues)
* **LiveKit WebRTC Server:** `localhost:7880` (Real-time audio streaming)

*(Note: Media storage is handled natively via `/public/uploads` on local disk, requiring zero MinIO container overhead or Docker image pulls).*

To verify all containers are running:
```powershell
docker ps
```

---

## Step 2: Install NPM Dependencies
Run npm install in the project root:
```powershell
npm install
```

---

## Step 3: Run the Next.js Development Server
Start the local Next.js server:
```powershell
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

You will see the **Hilokal Web Clone Dashboard** with real-time green checkmarks confirming active connections to MongoDB, Redis, Local Media Storage, and LiveKit.
