# Day 02: File Descriptions & Manifest

This document provides a comprehensive description of every file created or modified during the **Day 02 (Domain Data Models & Media Storage Pipeline)** milestone, explaining its role, internal technical specifications, and system interactions.

---

## 1. Mongoose Models (`src/models/`)

### `src/models/User.ts`
* **Role:** Primary identity, account profile, and free economy ledger state.
* **Technical Details:**
  * Defines `IUser` interface extending Mongoose `Document`.
  * Fields: `username` (unique, indexed, regex validated), `email` (unique, indexed), `passwordHash`, `displayName`, `avatarUrl`, `audioBioUrl` (URL to 30-second audio recording), `bio`, `countryCode`, `isVip` (default `true`), `coinsBalance` (default `500`), `currentStreak` (default `1`), `lastActiveAt`, and `totalTalkingTimeMinutes`.
  * Protects against model re-compilation in Next.js hot-reload development mode via `mongoose.models.User || mongoose.model(...)`.
* **Connection:** Referenced by all other domain entities (`UserLanguage`, `Room`, `RoomMessage`, `CoinTransaction`, `ScheduledTable`).

---

### `src/models/UserLanguage.ts`
* **Role:** Language learning profile and CEFR proficiency tracking.
* **Technical Details:**
  * Defines `IUserLanguage` interface.
  * Fields: `userId` (ObjectId ref User), `languageCode` (ISO 639-1 code), `type` (`'native'` or `'learning'`), `proficiency` (CEFR levels: `A1`, `A2`, `B1`, `B2`, `C1`, `C2`, or `native`), and `isPrimaryLearning` (boolean).
  * Enforces compound unique index `{ userId: 1, languageCode: 1 }` preventing duplicate language assignments per user.
  * Secondary discovery index on `{ languageCode: 1, type: 1 }` for partner matching.
* **Connection:** Populated during user onboarding and used to filter and recommend relevant audio tables.

---

### `src/models/Room.ts`
* **Role:** Persistent record of live and past audio tables.
* **Technical Details:**
  * Defines `IRoom` interface with `RoomStatus` (`'active'` | `'ended'`) and `TableType` (`'casual'` | `'practice'` | `'lesson'` | `'debate'`).
  * Fields: `title`, `description`, `topicTags`, `primaryLanguage`, `targetLevels`, `hostId` (ObjectId ref User), `coHostIds` (ObjectId[]), `maxSpeakers` (clamped between 2 and 10), `isPrivate`, `accessCode`, `tableType`, `bannerUrl` (free custom banner upload), `status`, `startedAt`, `endedAt`, and `totalParticipantsCount`.
  * Compound discovery indexes: `{ status: 1, primaryLanguage: 1 }` and `{ status: 1, createdAt: -1 }`.
* **Connection:** Referenced by `RoomMessage`, `AiSummary`, and LiveKit room token generation services.

---

### `src/models/ScheduledTable.ts`
* **Role:** Upcoming events calendar and tutor table RSVP management.
* **Technical Details:**
  * Defines `IScheduledTable` interface.
  * Fields: `title`, `description`, `hostId` (ObjectId ref User), `primaryLanguage`, `targetLevels`, `scheduledStartTime`, `estimatedDurationMinutes`, `bannerUrl`, `rsvpUserIds` (ObjectId[] ref User), `reminderSent`, and `status` (`'scheduled'` | `'live'` | `'completed'` | `'cancelled'`).
  * Index on `{ scheduledStartTime: 1, status: 1 }` for upcoming event queries.
* **Connection:** Used by BullMQ background queue for sending automated 15-minute start reminders to RSVP users.

---

### `src/models/RoomMessage.ts`
* **Role:** In-room chat stream, vocabulary corrections, and virtual gift audits.
* **Technical Details:**
  * Defines `IRoomMessage` interface.
  * Message types: `'text'`, `'correction'`, `'gift'`, and `'system'`.
  * Embedded subdocuments:
    * `correctionDetails`: `{ originalText, correctedText, explanation }` for peer language corrections.
    * `giftDetails`: `{ giftType, giftName, coinCost, recipientId }` tracking free virtual gifts sent to speakers on stage.
  * Chronological index: `{ roomId: 1, createdAt: 1 }`.
* **Connection:** Streamed to clients during live room sessions and used by Gemini AI to extract grammar corrections and flashcards.

---

### `src/models/AiSummary.ts`
* **Role:** AI-generated room discussion notes, vocabulary flashcards, and grammar tips.
* **Technical Details:**
  * Defines `IAiSummary` interface.
  * Fields: `roomId` (ObjectId ref Room), `hostId` (ObjectId ref User), `title`, `summaryMarkdown`, `topicsDiscussed`, `vocabularyWords` (array with `word`, `definition`, `exampleSentence`, `translation`), `grammarTips` (array with `original`, `suggestion`, `rule`), and `keyPhrases`.
  * Generated via Google Gemini 2.0/2.5 free tier API upon room close.
* **Connection:** Rendered on room recap screens and learner profile vocabulary decks.

---

### `src/models/CoinTransaction.ts`
* **Role:** Ledger tracking complimentary coins and virtual gifting.
* **Technical Details:**
  * Defines `ICoinTransaction` interface.
  * Types: `'initial_signup'`, `'daily_login_bonus'`, `'streak_reward'`, `'sent_gift'`, `'received_gift'`, `'host_tip'`.
  * Fields: `userId` (ObjectId ref User), `type`, `amount` (positive for credits, negative for debits), `balanceAfter`, `relatedUserId`, `relatedRoomId`, and `description`.
  * Index on `{ userId: 1, createdAt: -1 }` for user coin activity history.
  * Strictly free economy with zero payment gateway integration.
* **Connection:** Integrated with room gifting and daily login streak services.

---

### `src/models/index.ts`
* **Role:** Barrel export for the entire data layer.
* **Technical Details:** Re-exports all models and types for clean imports (`import { User, Room } from "@/models"`).

---

## 2. Media Upload & Storage Pipeline

### `src/app/api/media/upload/route.ts`
* **Role:** Server-side multipart file upload handler.
* **Technical Details:**
  * Accepts `multipart/form-data` with `file` and `bucket` parameters.
  * Bucket enforcement: `avatars`, `room-banners`, `audio-bios`.
  * MIME validation:
    * Images: `image/jpeg`, `image/png`, `image/webp`, `image/gif` (Max 5MB).
    * Audio: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/x-m4a` (Max 10MB).
  * Uses Node.js crypto to generate cryptographically random, collision-free filenames (`${Date.now()}-${uuid}.${ext}`).
  * Invokes `saveLocalMedia()` from `src/lib/storage.ts` to persist directly to `public/uploads/<bucket>/`.
* **Connection:** Called by avatar upload UI, audio bio recorder, and room creation modal.

---

### `src/lib/media-service.ts`
* **Role:** Client-side TypeScript helper functions for media handling.
* **Technical Details:**
  * `uploadMedia(file, bucket)`: General wrapper around `/api/media/upload`.
  * `uploadAvatar(file)`: Dedicated avatar helper.
  * `uploadRoomBanner(file)`: Dedicated table banner helper.
  * `uploadAudioBio(audioBlob)`: Converts WebM audio recording blob from browser MediaRecorder and submits to `audio-bios` bucket.
* **Connection:** Consumed by React frontend components across the application.

---

## 3. Testing & UI Diagnostic Files

### `src/app/api/test-db/route.ts`
* **Role:** Database and model diagnostic validation API.
* **Technical Details:**
  * `GET`: Connects to MongoDB via connection pool and queries document counts for all 7 models.
  * `POST`: Seeds a test user (with free VIP and 500 coins), native and learning language preferences, an active audio table, and a welcome coin transaction.
* **Connection:** Queried directly by the Developer Dashboard in `src/app/page.tsx`.

---

### `src/app/page.tsx`
* **Role:** Developer Dashboard & Milestone Verification UI.
* **Technical Details:**
  * Interactive React 19 Client Component with Tailwind CSS dark theme.
  * Includes Day 1 local infrastructure health checkers (MongoDB, Redis, Local Storage, LiveKit).
  * Includes Day 2 model catalog displaying live document counts for all 7 collections.
  * Includes interactive "Seed Test Learner" action to test database writing.
  * Includes live browser file picker and upload tester calling `/api/media/upload`.
* **Connection:** Rendered when visiting `http://localhost:3000`.

---

## 4. Documentation Files

### `docs/day-01/issues-encountered.md`
* **Role:** Detailed post-mortem of Day 1 blockers and preventative measures taken.
* **Details:** Thorough documentation covering PowerShell Group Policy blocking, MinIO Docker pull failures, npm package version discrepancies, and PostCSS autoprefixer setup.

### `docs/day-02/tasks-completed.md`
* **Role:** High-level summary of all Day 2 completed tasks.

### `docs/day-02/file-descriptions.md`
* **Role:** This document (manifest and detailed role descriptions).

### `docs/day-02/setup-instructions.md`
* **Role:** Step-by-step user guide for running and verifying Day 2 deliverables.
