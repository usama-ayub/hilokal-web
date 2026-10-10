# Day 01: File Descriptions & Manifest

This document provides a comprehensive description of every file created during the Day 01 milestone, explaining its role, technical details, and interactions with other parts of the system.

---

## 1. Documentation & Architecture Files

### `docs/architecture/system-design.md`
* **Role:** High-level blueprint of the entire platform.
* **Details:** Illustrates the data flow between client browsers, Next.js API layer, LiveKit SFU media server, Redis cache/state cluster, MongoDB persistence, MinIO storage, and Google Gemini AI API.
* **Connection:** Serves as the master architectural reference for all subsequent development phases.

### `docs/architecture/database-schema.md`
* **Role:** MongoDB data specification.
* **Details:** Defines the structure, types, constraints, and indexes for all 7 collections (`users`, `user_languages`, `rooms`, `scheduled_tables`, `room_messages`, `ai_summaries`, `coin_transactions`).
* **Connection:** Informs the Mongoose models to be implemented in Day 02.

### `docs/architecture/redis-data-structures.md`
* **Role:** Specification for all in-memory caching and real-time state.
* **Details:** Specifies the exact keys, data structures (Strings, Hashes, Sets, Sorted Sets), TTL values, and Pub/Sub channels used for user presence, live room states, and hand-raise queues.
* **Connection:** Informs the Redis state services to be implemented in Days 03 and 04.

---

## 2. Infrastructure & Configuration Files

### `docker-compose.yml`
* **Role:** Multi-container Docker orchestration for local development.
* **Services Included:**
  * `mongodb`: MongoDB 7.0 database running on port `27017`.
  * `redis`: Redis 7.2 running on port `6379` with password protection.
  * `minio`: MinIO S3 object storage server running on ports `9000` (API) and `9001` (Web Console).
  * `minio-init`: Ephemeral container that configures MinIO and initializes the `avatars`, `room-banners`, and `audio-bios` buckets with public download policies.
  * `livekit`: LiveKit SFU WebRTC audio server running on ports `7880` (Signaling), `7881` (TCP fallback), and `50000-50050/udp` (Audio RTP traffic).
* **Connection:** Powers all local backend services required by the application.

### `docker/livekit.yaml`
* **Role:** Configuration file for the LiveKit WebRTC server.
* **Details:** Sets up port binding, RTC port ranges, and defines API credentials (`devkey` / `secretvalue...`).
* **Connection:** Mounted directly into the `livekit` container within `docker-compose.yml`.

### `.env.example` & `.env.local`
* **Role:** Environment configuration templates.
* **Details:** Specifies all connection strings, secrets, and URLs for MongoDB, Redis, MinIO, LiveKit, JWT authentication, and Google Gemini.
* **Connection:** Loaded by Next.js and backend modules to access configuration securely.

### `package.json`
* **Role:** Project manifest and dependencies list.
* **Details:** Contains modern, stable versions of Next.js 15, React 19, LiveKit Client & Server SDKs, Mongoose, IORedis, MinIO client, Tailwind CSS, BullMQ, and Lucide React.
* **Connection:** Read by `npm` / `pnpm` / `yarn` to install all dependencies.

### `tsconfig.json`
* **Role:** TypeScript compiler configuration.
* **Details:** Sets strict mode, ES2022 target, and configures the `@/*` path alias mapping to `./src/*`.
* **Connection:** Used by the TypeScript compiler and VS Code for type checking and autocomplete.

### `tailwind.config.js` & `postcss.config.js`
* **Role:** Styling and CSS preprocessing.
* **Details:** Customizes theme colors for Hilokal (Indigo brand colors, Slate dark mode surfaces, Gold VIP accents).
* **Connection:** Compiled by PostCSS to generate production CSS for `globals.css`.

---

## 3. Core Application & Library Files

### `src/lib/utils.ts`
* **Role:** General utility functions.
* **Details:** Exports `cn(...)` for merging Tailwind CSS classes safely and `formatDuration(...)` for audio time formatting.
* **Connection:** Used across all frontend components.

### `src/lib/db.ts`
* **Role:** Database connection manager.
* **Details:** Implements a Mongoose connection pooling singleton that caches connections across Next.js API route invocations to avoid opening duplicate database connections.
* **Connection:** Used by all API routes and background workers that interact with MongoDB.

### `src/lib/redis.ts`
* **Role:** Redis client singleton.
* **Details:** Configures an `ioredis` instance with automatic reconnection logic, connection event listeners, and password authentication.
* **Connection:** Used by presence services, hand-raise queue managers, and rate limiters.

### `src/lib/storage.ts`
* **Role:** Object storage (MinIO/S3) client and presigned URL generator.
* **Details:** Exports helper functions `getPresignedUploadUrl(...)` for direct browser-to-MinIO uploads and `getPublicMediaUrl(...)` for fetching avatar/audio URLs.
* **Connection:** Used by profile update and room creation endpoints to handle avatars, room banners, and audio bios without routing heavy file bytes through the Node.js server.

### `src/lib/livekit.ts`
* **Role:** LiveKit WebRTC access token generator.
* **Details:** Creates cryptographically signed JWT tokens with granular audio permissions (`canPublish`, `canSubscribe`, `roomAdmin`) according to user roles (`host`, `speaker`, `listener`).
* **Connection:** Used by the room join API endpoint when admitting users to live tables.

---

## 4. UI & Diagnostic Endpoints

### `src/app/globals.css`
* **Role:** Global stylesheet.
* **Details:** Injects Tailwind base, components, and utilities, defines dark background variables, and adds keyframe animations for active audio speaking indicator pulses (`.speaking-active`).
* **Connection:** Loaded globally by `src/app/layout.tsx`.

### `src/app/layout.tsx`
* **Role:** Next.js root HTML shell.
* **Details:** Sets dark mode default class, responsive viewport, metadata, and wraps all page contents.
* **Connection:** Wraps every page inside the Next.js App Router.

### `src/app/api/health/route.ts`
* **Role:** System diagnostics API endpoint.
* **Details:** Executes live pings against MongoDB, Redis, and MinIO storage, reporting connectivity status and response latency in milliseconds.
* **Connection:** Queried by `src/app/page.tsx` to verify that all Docker services are running properly.

### `src/app/page.tsx`
* **Role:** Developer dashboard and landing page.
* **Details:** Displays platform badges (Free VIP Unlocked, 500 Daily Free Coins), shows live real-time status cards for each local service (MongoDB, Redis, MinIO, LiveKit), and outlines upcoming milestones.
* **Connection:** Rendered when visiting `http://localhost:3000`.
