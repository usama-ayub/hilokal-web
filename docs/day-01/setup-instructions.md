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
* **MongoDB:** `localhost:27017`
* **Redis:** `localhost:6379`
* **MinIO S3 API:** `localhost:9000`
* **MinIO Web Console:** `http://localhost:9001` (User: `minioadmin` / Pass: `minioadminpassword123`)
* **LiveKit WebRTC Server:** `localhost:7880`

To verify all containers are healthy:
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

You will see the **Hilokal Web Clone Dashboard** with real-time green checkmarks confirming active connections to MongoDB, Redis, MinIO S3, and LiveKit.

---

## Step 4: Accessing MinIO Console (Optional)
If you want to view uploaded profile avatars, audio bios, or room banners:
1. Open `http://localhost:9001` in your browser.
2. Sign in with:
   * **Username:** `minioadmin`
   * **Password:** `minioadminpassword123`
3. You will see the automatically created buckets: `avatars`, `audio-bios`, and `room-banners`.
