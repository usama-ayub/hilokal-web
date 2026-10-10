# Day 06: Setup & Testing Instructions

This guide walks you through configuring Google Gemini (Free Tier) and testing all Day 06 AI Language Coaching and Flashcard features.

---

## 1. Optional: Adding Your Free Google Gemini API Key

The platform includes an intelligent contextual fallback engine that works completely offline out-of-the-box. To enable live AI generations with Google Gemini:

1. Visit [Google AI Studio](https://aistudio.google.com/) and generate a free API key.
2. Open [`.env.local`](file:///D:/Project/Hilokal%20Clone/.env.local) in your project root.
3. Paste your key:
   ```env
   GEMINI_API_KEY=AIzaSyYourKeyHere...
   ```
4. Restart your Next.js dev server if you edit `.env.local`:
   ```powershell
   npm run dev
   ```

> [!NOTE]
> **Google Gemini Free Tier Limits:**
> * 15 Requests Per Minute (RPM)
> * 1,000,000 Tokens Per Minute (TPM)
> * 1,500 Requests Per Day (RPD)
> If the limit is ever reached, our engine automatically falls back to contextual notes with zero downtime.

---

## 2. Testing the In-Room AI Co-Host & Flashcards

1. Open your browser at `http://localhost:3000`.
2. Make sure you are signed in (or click **"Register New Learner"** to get an instant account with Free VIP).
3. Under **Audio Stage & Interactive Learner Hub**, click **"Host Audio Table"** or click **"Join Table"** on an active table.
4. Inside the active table, click the **"AI Co-Host & Flashcards (Free Gemini)"** tab (4th tab).
5. **Test Conversation Starters:**
   - Observe the 4 generated conversation questions in the room's language.
   - Click **"Share to Chat Feed"** on any card — switch back to the **"Live Chat & Corrections"** tab and see the question posted automatically!
6. **Test Instant Phrase Explainer:**
   - Enter a phrase like `Me cuesta trabajo hablar en público` or `No veo la hora de verte`.
   - Click **"Explain"** and review the instant translation, grammatical explanation, and natural variations.
7. **Test Session Summary & Flashcards:**
   - Click **"Generate Session Summary 📑"**.
   - Review the generated Markdown discussion notes, key topics, and 5 interactive flashcards.
   - Click on any flashcard to flip between the term and its definition/example.
   - Click **"Mark Mastered"** to see your progress counter increment (`1/5 Mastered`).

---

## 3. Testing the Standalone AI Coaching Playground

Even without entering an audio table, scroll down to the **"Day 6 Milestone: Google Gemini AI Language Coach & Flashcard Deck"** section on the main page:
1. Select a language (e.g., Japanese `JA` or French `FR`) and CEFR level (`A2`).
2. Click **"Generate 4 Starters"** to test prompts dynamically.
3. Test the **"AI Sentence Breakdown & Grammar Explainer"** with any custom sentence.

---

## 4. API Verification via PowerShell

You can also test the endpoints directly using `Invoke-RestMethod`:

```powershell
# Test Conversation Starters
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/conversation-prompts" -Method POST -ContentType "application/json" -Body '{"language":"es","level":"B1"}' | ConvertTo-Json -Depth 3

# Test Phrase Explainer
Invoke-RestMethod -Uri "http://localhost:3000/api/ai/explain-phrase" -Method POST -ContentType "application/json" -Body '{"phrase":"Me cuesta trabajo hablar en público","language":"es"}' | ConvertTo-Json -Depth 3
```
