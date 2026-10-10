# Day 04: File Descriptions & Manifest

This document catalogs every file created or modified during the **Day 04 (LiveKit Audio Infrastructure & Signaling)** milestone, detailing its purpose, technical implementation, and architectural interactions.

---

## 1. LiveKit Audio & WebRTC Infrastructure

### `src/lib/livekit.ts`
* **Role:** LiveKit server SDK integration for WebRTC token signing and administrative room controls.
* **Technical Details:**
  * Uses `AccessToken` from `livekit-server-sdk` to generate signed JWTs with grants (`roomJoin`, `canPublish`, `canSubscribe`, `canPublishData`, `roomAdmin`).
  * Provides singleton `RoomServiceClient` connected to `http://localhost:7880`.
  * Exports `listLiveKitParticipants`, `muteLiveKitParticipant`, `removeLiveKitParticipant`, `updateLiveKitPermissions`, and `deleteLiveKitRoom`.
* **System Interaction:** Used by `/api/rooms`, `/api/rooms/[id]/token`, `/api/rooms/[id]/stage-action`, and `/api/rooms/[id]/end`.

---

## 2. In-Memory Room State Engine

### `src/lib/room-state.ts`
* **Role:** High-throughput in-memory state engine managing ephemeral audio room participants and queues in Redis.
* **Technical Details:**
  * `room:{id}:speakers`: Redis `SET` of user IDs on the speaking stage.
  * `room:{id}:listeners`: Redis `SET` of audience user IDs.
  * `room:{id}:hand_raise_queue`: Redis `SORTED SET (ZSET)` scoring user IDs by microsecond timestamp (`Date.now()`).
  * `room:{id}:meta`: Redis `HASH` storing host ID, start time, and global room toggles.
  * `user:{id}:active_room`: Key preventing concurrent multi-room joins.
  * Methods: `initRoomState`, `joinRoomState`, `leaveRoomState`, `raiseHand`, `lowerHand`, `promoteToSpeaker`, `demoteToListener`, `getRoomRealtimeState`, and `cleanRoomState`.
* **System Interaction:** Powers all real-time table participation APIs with zero database bottleneck.

---

## 3. Audio Table API Routes

### `src/app/api/rooms/route.ts`
* **Role:** Audio table collection handler.
* **Technical Details:**
  * `GET`: Queries MongoDB `Room` collection and enriches each result with live speaker, listener, and hand-raise counts from Redis.
  * `POST`: Authenticated endpoint that creates a new `Room` document with Free VIP settings, initializes Redis state (`initRoomState`), and returns the host's LiveKit token.
* **System Interaction:** Used by the table discovery feed and table creator forms.

---

### `src/app/api/rooms/[id]/route.ts`
* **Role:** Room detail and live state inspector.
* **Technical Details:**
  * Fetches `Room` document from MongoDB and queries Redis via `getRoomRealtimeState`.
  * Populates user profiles (`displayName`, `avatarUrl`, `isVip`, `countryCode`) for all stage speakers, audience members, and queue candidates.
* **System Interaction:** Consumed by in-room clients to render the stage UI and attendee lists.

---

### `src/app/api/rooms/[id]/token/route.ts`
* **Role:** LiveKit WebRTC access token dispatch.
* **Technical Details:**
  * Determines user role (`host`, `speaker`, or `listener`).
  * Registers user into Redis room state.
  * Generates signed LiveKit token with appropriate publishing and subscription grants.
* **System Interaction:** Called prior to establishing a WebRTC connection to LiveKit SFU.

---

### `src/app/api/rooms/[id]/hand-raise/route.ts`
* **Role:** Audience hand-raising management.
* **Technical Details:**
  * Supports `action: "raise"`: Inserts user into Redis `ZSET` and returns their 1-indexed FIFO queue rank.
  * Supports `action: "lower"`: Removes user from Redis `ZSET`.
* **System Interaction:** Invoked when audience members press "Raise Hand" or "Lower Hand".

---

### `src/app/api/rooms/[id]/stage-action/route.ts`
* **Role:** Host stage moderation actions.
* **Technical Details:**
  * Enforces host/co-host authorization.
  * `promote`: Atomically moves user from queue/audience to speakers set and updates LiveKit permissions to `canPublish: true`.
  * `demote`: Atomically moves speaker to listeners set and revokes LiveKit publish permissions.
  * `kick`: Removes user from Redis and ejects them via `removeLiveKitParticipant`.
  * `mute`: Mutes participant track via `muteLiveKitParticipant`.
* **System Interaction:** Triggered by host moderation buttons on the stage.

---

### `src/app/api/rooms/[id]/leave/route.ts`
* **Role:** Clean participant departure.
* **Technical Details:**
  * Purges user from speakers, listeners, and queue in Redis.
  * Deletes `user:{id}:active_room`.
* **System Interaction:** Called when a participant clicks "Leave Table".

---

### `src/app/api/rooms/[id]/end/route.ts`
* **Role:** Table termination handler.
* **Technical Details:**
  * Restricts access strictly to the room host.
  * Updates MongoDB `Room.status` to `"ended"`.
  * Deletes all Redis keys associated with the room.
  * Calls `deleteLiveKitRoom` to shut down the SFU room.
* **System Interaction:** Triggered when the host closes the audio stage.

---

## 4. Client State & WebRTC Integration

### `src/hooks/useLiveKitRoom.ts`
* **Role:** React client hook wrapping the `livekit-client` SDK.
* **Technical Details:**
  * Manages `Room` lifecycle: connection, disconnection, track subscription.
  * Automatically binds remote audio tracks to `<audio>` elements for live audio playback.
  * Handles mic muting and unmuting (`localParticipant.setMicrophoneEnabled`).
  * Exposes reactive state: `isConnected`, `isConnecting`, `isMuted`, `participants`, and error states.
* **System Interaction:** Used by audio stage UI components to interface with LiveKit SFU.

---

### `src/app/page.tsx`
* **Role:** Developer Dashboard & Milestone Verification UI.
* **Technical Details:**
  * Enhanced with the **Day 4 Milestone: LiveKit Audio Infrastructure & Signaling Control Panel**.
  * Contains an interactive table creator and live table browser.
  * Includes an interactive stage view showing participants, mic status, speaking animations, FIFO hand-raise controls, and host actions.
