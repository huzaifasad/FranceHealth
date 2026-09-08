# Updating the System Prompt

The system prompt is stored in **SQLite** (`backend/data/app.db`, created automatically on first run), not hardcoded in `server.js`.

## How to update it

**Option A — through the UI (recommended):** open `/prompt` on the frontend, edit the text, click Save. That page calls this backend's own `GET`/`POST /api/prompt`, which reads/writes the SQLite row directly.

**Option B — via the API directly:**
```bash
curl -X POST http://localhost:3001/api/prompt \
  -H "Content-Type: application/json" \
  -d '{"prompt": "your full prompt text here"}'
```

## First run / reset

On its very first start, if the `settings` table is empty, the backend seeds itself from `backend/prompt.txt` (see `db.js` → `seedPromptIfEmpty()`). After that first seed, `prompt.txt` is not read again — the database is the source of truth. To force a full reset back to `prompt.txt`, stop the app and delete `backend/data/app.db`, then restart.

## What the prompt is responsible for now

The prompt no longer needs to explain how to detect whether a value is in or out of range — that comparison is done deterministically in code (`lab-parser.js`) before the AI ever sees the results. The AI receives an already-classified list and is instructed never to recompute or override that status; its job is limited to writing the pedagogical (non-diagnostic) descriptions and following the required output structure.
