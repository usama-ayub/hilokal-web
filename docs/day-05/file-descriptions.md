# Day 05: File Descriptions

This document details all files created and modified during **Day 05 (In-Room Live Interactive Engagement & Free Virtual Gift Economy)**.

---

## 1. Core Services & Domain Utilities

### [`src/lib/gifts-catalog.ts`](file:///D:/Project/Hilokal%20Clone/src/lib/gifts-catalog.ts)
* **Purpose:** Pure, client-safe definition of the virtual gift catalog and TypeScript interfaces with zero Node.js server dependencies.
* **Key Components:**
  * `VIRTUAL_GIFTS`: Catalog of 5 appreciation gifts (`coffee`, `rose`, `trophy`, `crown`, `diamond`) with costs, descriptions, and animation styles.
  * `getGiftById`: Lookup utility for gift items.
  * `GiftItem`: Shared interface for client and server.

### [`src/lib/gifts.ts`](file:///D:/Project/Hilokal%20Clone/src/lib/gifts.ts)
* **Purpose:** Server-side virtual gift atomic double-entry balance transfer engine.
* **Key Components:**
  * `transferVirtualGift`: Core business logic executing balance checks, deducting coins from sender, crediting coins to recipient, logging double-entry `CoinTransaction` records, creating an in-room `RoomMessage` gift record, and publishing to Redis Pub/Sub channel `room:{id}:events`.

### [`next.config.mjs`](file:///D:/Project/Hilokal%20Clone/next.config.mjs)
* **Purpose:** Next.js build configuration specifying `serverExternalPackages: ["ioredis", "mongoose", "bcryptjs", "livekit-server-sdk"]` to ensure server-side packages are never bundled into client bundles.

---

## 2. API Endpoints

### [`src/app/api/gifts/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/gifts/route.ts)
* **Purpose:** Exposes available virtual gifts to the frontend.
* **HTTP Method:** `GET`
* **Response:** JSON list of gifts with coin costs, names, and emojis.

### [`src/app/api/rooms/[id]/gifts/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/rooms/%5Bid%5D/gifts/route.ts)
* **Purpose:** In-room virtual gift delivery endpoint.
* **HTTP Method:** `POST`
* **Request Body:** `{ recipientId: string, giftId: string }`
* **Response:** Success status, updated sender balance, and populated room message.

### [`src/app/api/rooms/[id]/messages/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/rooms/%5Bid%5D/messages/route.ts)
* **Purpose:** Room chat feed retrieval and new message / language correction submission.
* **HTTP Methods:**
  * `GET`: Fetches chronological messages for the room with populated sender and gift details.
  * `POST`: Creates standard text messages or structured language corrections (`originalText`, `correctedText`, `explanation`) and broadcasts to Redis Pub/Sub.

### [`src/app/api/coins/balance/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/coins/balance/route.ts)
* **Purpose:** Provides user's current coin balance, daily streak progress, and double-entry transaction audit history.
* **HTTP Method:** `GET`
* **Response:** `{ balance, currentStreak, isVip, transactions: CoinTransaction[] }`

---

## 3. Client User Interface

### [`src/app/page.tsx`](file:///D:/Project/Hilokal%20Clone/src/app/page.tsx)
* **Purpose:** Enhanced with the Day 5 Interactive Engagement Suite inside active audio tables:
  * **Live Chat & Corrections Tab:** Auto-scrolling chat feed rendering standard messages, distinct highlighted language correction diffs, and festive gift banners.
  * **Language Correction Composer:** Modal toggle enabling teachers/hosts to compose structured grammar tips.
  * **Free Virtual Gift Drawer:** Recipient picker, gift selector, and one-click dispatch with floating celebration animation.
  * **Coin Ledger Tab:** Real-time double-entry audit history of coin rewards and gifts.
  * **LiveKit Data Channel Integration:** Instant peer-to-peer message synchronization (`CHAT_MESSAGE`, `CORRECTION`, `VIRTUAL_GIFT`).
