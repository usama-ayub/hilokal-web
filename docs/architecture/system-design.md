# System Architecture & Specifications (Hilokal Clone Web)

## 1. Overview
Hilokal Clone Web is a real-time, audio-first language exchange and learning web application. It enables learners from across the globe to join live audio "tables" (rooms), converse with native speakers, practice grammar, and interact via text, whiteboard, and reactions.

All features that are traditionally paid or subscription-based in Hilokal (VIP Badges, Coins/Gifting, Room Customizations, AI feedback) are **100% free** in this platform, with zero payment gateway dependencies.

---

## 2. Architectural Blueprint

```text
                                [ Client Browser (Next.js 15 SPA/PWA) ]
                                                   │
                        ┌──────────────────────────┴──────────────────────────┐
                        │                                                     │
               (HTTP / REST / API)                                   (WebRTC Audio Media)
                        │                                                     │
             [ Cloudflare / Reverse Proxy ]                                   │
                        │                                                     │
             [ Next.js / Node.js Server ]                                     │
           (Auth, Business Logic, DB Ops)                                     │
            │           │             │                                       │
            │           │             │                                       │
     ┌──────▼──┐  ┌─────▼─────┐  ┌────▼────────┐                     [ LiveKit SFU Server ]
     │ MongoDB │  │   Redis   │  │ MinIO (S3)  │                     (Real-Time WebRTC Audio)
     │ (Data)  │  │ (Cache &  │  │  (Storage)  │                              │
     └─────────┘  │  Pub/Sub) │  └─────────────┘                              │
                  └─────┬─────┘                                               │
                        │                                                     │
                 (Task Queue)                                                 │
                        │                                                     │
              [ BullMQ Background ]                                           │
              [  Worker Cluster   ] ◄─────────────────────────────────────────┘
                        │                   (Egress Audio Transcripts)
                        ▼
             [ Google Gemini API ]
             (Free Tier AI Engine)
```

---

## 3. Core Subsystems

### 3.1 WebRTC Audio Engine (LiveKit SFU)
* **Architecture:** Selective Forwarding Unit (SFU). Unlike mesh WebRTC where each participant sends audio to every other participant, LiveKit forwards audio via a centralized low-latency server.
* **Audio Roles:**
  * **Host:** Full administrative control (mute/kick participants, grant speaker permissions).
  * **Speaker:** Audio track published to the room.
  * **Listener:** Subscribed to audio tracks only (publish disabled).
* **Token Auth:** The API server generates cryptographic JWT tokens using `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` specifying room permissions.

### 3.2 Real-time State & Caching Engine (Redis)
* **Presence:** Tracks active connections using TTL keys (`user:{id}:presence`).
* **Room Ephemeral State:** Active speakers, hand-raise queue, and audio states are stored in Redis to eliminate database query overhead.
* **Hand-Raise FIFO Queue:** Redis Sorted Sets (`ZSET`) order hand raises by exact microsecond timestamps.
* **Rate Limiting:** Protects endpoints from abuse using sliding-window rate limiters.

### 3.3 Persistence Layer (MongoDB)
* Persistent records: User accounts, language learning profiles, past table history, direct messages, and AI flashcards.
* Indexes are established on frequently queried paths (`targetLanguage`, `nativeLanguage`, `createdAt`).

### 3.4 Media & Object Storage (MinIO S3-Compatible)
* Direct-to-storage upload pipeline using pre-signed URLs.
* High bandwidth media (user profile avatars, room custom banners, 30-second audio bios) bypasses the Node.js API server to conserve RAM and network I/O.

### 3.5 Free AI & Gamification Engine
* **Virtual Coins:** Users receive 500 complimentary coins daily upon login to tip speakers and send animated gifts.
* **AI Analysis:** Google Gemini API (Free tier) processes room conversation summaries and extracts 5 vocabulary items once an audio table concludes.

---

## 4. Free & Open-Source Tech Stack Matrix

| Layer | Technology | License | Operational Limits |
| :--- | :--- | :--- | :--- |
| Frontend & API | Next.js 15, React 19, Tailwind CSS | MIT (Free) | No license limits |
| Primary Database | MongoDB 7.0 Community | SSPL (Free) | Hardware storage bound |
| Cache & Message Broker | Redis 7.2 | BSD-3 (Free) | In-memory RAM bound (~256MB) |
| Audio Media Server | LiveKit SFU (Go) | Apache 2.0 (Free) | Bandwidth & CPU bound |
| Object Storage | MinIO Server | AGPL-v3 (Free) | Local disk capacity bound |
| AI Integration | Google Gemini API | Free Developer Tier | 15 RPM / 1M TPM / 1500 RPD |
| Icons & UI Components | Lucide React, Radix UI | MIT (Free) | No license limits |
