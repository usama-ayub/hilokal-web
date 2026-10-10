# Redis In-Memory Data Structures & Key Specifications

This document outlines all Redis keys, data structures, and Time-To-Live (TTL) policies used to power real-time presence, audio room state, hand-raise queues, and distributed rate limiting.

---

## 1. User Presence & Heartbeats

### 1.1 Online Status Key
* **Key Format:** `presence:user:{userId}`
* **Type:** `STRING`
* **Value:** `"online"`
* **TTL:** `60 seconds`
* **Mechanism:** The client sends a lightweight heartbeat every 30 seconds. If a connection abruptly drops (browser close, network drop), the key automatically expires after 60 seconds without requiring a manual logout event.

### 1.2 User Current Room Location
* **Key Format:** `user:{userId}:active_room`
* **Type:** `STRING`
* **Value:** `{roomId}`
* **TTL:** `60 seconds` (Refreshed along with the heartbeat)
* **Purpose:** Prevents a single user from joining multiple audio stages simultaneously.

---

## 2. Active Audio Room State (Ephemeral)

### 2.1 Room Active Speakers
* **Key Format:** `room:{roomId}:speakers`
* **Type:** `SET`
* **Members:** `{userId}`
* **TTL:** Cleaned up when room ends or on host leave.
* **Purpose:** O(1) lookup to check if a user is currently allowed to unmute on stage.

### 2.2 Room Active Listeners
* **Key Format:** `room:{roomId}:listeners`
* **Type:** `SET`
* **Members:** `{userId}`
* **Purpose:** Real-time audience count without hitting MongoDB.

### 2.3 Hand-Raise Priority Queue (FIFO)
* **Key Format:** `room:{roomId}:hand_raise_queue`
* **Type:** `SORTED SET (ZSET)`
* **Score:** `Timestamp (milliseconds since epoch)`
* **Member:** `{userId}`
* **Operation:** 
  * Add: `ZADD room:{roomId}:hand_raise_queue <timestamp> <userId>`
  * Fetch Ordered: `ZRANGE room:{roomId}:hand_raise_queue 0 -1`
  * Remove when promoted to speaker: `ZREM room:{roomId}:hand_raise_queue <userId>`
* **Advantage:** Preserves exact chronological order of who raised their hand first.

### 2.4 Room Meta Hash
* **Key Format:** `room:{roomId}:meta`
* **Type:** `HASH`
* **Fields:**
  * `hostId`: User ID of host
  * `startedAt`: Timestamp
  * `primaryLanguage`: e.g., `"en"`
  * `isMutedAll`: `"true"` | `"false"`
* **TTL:** Expired 24 hours after room termination.

---

## 3. Real-Time Pub/Sub Channels

| Channel Pattern | Message Payload | Purpose |
| :--- | :--- | :--- |
| `channel:room:{roomId}:events` | `{ event: "HAND_RAISE", userId, timestamp }` | Broadcasts hand raises, promotions, and kicks to in-room WebSocket subscribers. |
| `channel:room:{roomId}:chat` | `{ event: "NEW_MESSAGE", messageId, sender, text }` | Delivers real-time in-room chat messages to active participants. |
| `channel:user:{userId}:notifications` | `{ type: "EVENT_REMINDER", roomId, title }` | Sends instant direct notifications to online users. |

---

## 4. Rate Limiting & Protection

* **Key Format:** `ratelimit:{endpoint}:{ip_or_userId}`
* **Type:** `STRING` (Counter)
* **TTL:** `60 seconds`
* **Thresholds:**
  * Audio Room Creation: 5 per hour
  * Chat Messages: 30 per minute
  * AI Grammar Checks: 15 per minute (conforms to Gemini Free Tier quotas)
