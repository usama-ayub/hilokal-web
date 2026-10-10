# Day 06: File Descriptions

This document details all files created and modified during **Day 06 (AI Language Coaching & Room Summary Generation)**.

---

## 1. Core Services & Domain Utilities

### [`src/lib/gemini.ts`](file:///D:/Project/Hilokal%20Clone/src/lib/gemini.ts)
* **Purpose:** Google Gemini Free Tier SDK client and language coaching logic with automatic contextual fallback.
* **Key Functions:**
  * `generateRoomSummaryWithGemini`: Prompts `gemini-2.5-flash` using structured JSON schema output to produce markdown session overviews, 5 vocabulary flashcards, and grammar tips.
  * `generateContextualFallbackSummary`: Zero-dependency fallback generator providing realistic language study notes if `GEMINI_API_KEY` is not yet set or during network/quota interruptions.
  * `generateConversationStarters`: Generates 4 engaging icebreakers in the target language (Spanish, English, Japanese, French, Urdu).
  * `explainPhrase`: Instant sentence breakdown, translation, and natural synonym generation.

---

## 2. API Endpoints

### [`src/app/api/ai/summarize-room/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/ai/summarize-room/route.ts)
* **Purpose:** Generates or updates the AI post-room summary and 5 vocabulary flashcards.
* **HTTP Method:** `POST`
* **Request Body:** `{ roomId: string }`
* **Database Action:** Pulls all `RoomMessage` records (chat & corrections), generates notes via `src/lib/gemini.ts`, and upserts into `AiSummary` collection.
* **Response:** `{ success: true, summary: AiSummary, isAiGenerated: boolean, modelUsed: string }`

### [`src/app/api/ai/room-summary/[roomId]/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/ai/room-summary/%5BroomId%5D/route.ts)
* **Purpose:** Retrieves existing AI summary notes and vocabulary cards for a room.
* **HTTP Method:** `GET`
* **Response:** `{ success: true, summary: AiSummary }`

### [`src/app/api/ai/conversation-prompts/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/ai/conversation-prompts/route.ts)
* **Purpose:** Dynamically generates icebreaker questions for audio tables.
* **HTTP Method:** `POST`
* **Request Body:** `{ language: string, level?: string }`
* **Response:** `{ success: true, language, level, starters: Array<{ topic, question, translation }> }`

### [`src/app/api/ai/explain-phrase/route.ts`](file:///D:/Project/Hilokal%20Clone/src/app/api/ai/explain-phrase/route.ts)
* **Purpose:** Instant phrase breakdown, translation, and grammatical explanation.
* **HTTP Method:** `POST`
* **Request Body:** `{ phrase: string, language?: string }`
* **Response:** `{ success: true, data: { original, translation, explanation, alternativeExpressions } }`

---

## 3. Client User Interface

### [`src/app/page.tsx`](file:///D:/Project/Hilokal%20Clone/src/app/page.tsx)
* **Purpose:** Enhanced with full Day 6 interactive AI features:
  * **Stage Tab 4 ("AI Co-Host & Flashcards"):**
    * Dynamic conversation starters with 1-click sharing to the in-room chat.
    * Instant phrase and idiom explainer.
    * "Generate Session Summary" button triggering Gemini analysis.
    * 5 interactive flip flashcards with "Mark as Mastered" progress counter.
  * **Day 6 Standalone Showcase Section:**
    * Multi-language AI conversation starter generator (ES, EN, JA, FR, UR) across CEFR levels (A1 to C1).
    * Standalone sentence breakdown playground.
