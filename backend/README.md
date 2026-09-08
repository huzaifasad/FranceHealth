# The System Prompt

The system prompt is what tells the AI how to write its explanations — tone, what it's allowed to say, the exact output format, etc. It's stored in **SQLite** (`backend/data/app.db`, created automatically on first run), not hardcoded anywhere.

## Access — `/prompt` can be password-protected (currently: open)

Editing the prompt controls the AI's actual safety behavior, so `/prompt` (on the frontend) *can* require a password before it shows anything — that's toggled by whether `PROMPT_ADMIN_PASSWORD` is set:

- **Set** → full protection, as described below.
- **Blank/unset** → the gate is off entirely, `/prompt` is open to anyone, no login. **This is the current state.** Toggle it back any time by setting `PROMPT_ADMIN_PASSWORD` again — nothing else needs to change or be rebuilt.

**How it works, in simple steps:**
1. Someone opens `/prompt`.
2. If they don't have a valid login session yet, they see a password box — nothing else, no prompt content is shown.
3. They type the password (set once by you, see below) and click "Se connecter".
4. The frontend checks it against `PROMPT_ADMIN_PASSWORD` (an environment variable, not a database — same place `OPENAI_API_KEY` lives). If it matches, it's given a signed cookie that proves "this browser is logged in" for 24 hours.
5. With that cookie, `/prompt` shows the real editor, and the underlying `GET`/`POST /api/prompt` endpoints (which is what actually reads/writes the prompt) start accepting requests from that browser. Without it, both are blocked — reading the prompt requires login too, not just saving, since the text itself reveals how the AI's guardrails are worded.
6. There's a "Déconnexion" button in the editor to end the session early; otherwise it just expires after 24h.

**Setting the password (one-time):** add to your `.env` (the root one, read by `docker-compose.yml` if you're using Docker):
```
PROMPT_ADMIN_PASSWORD=pick-a-real-password-here
PROMPT_SESSION_SECRET=some-long-random-string
```
`PROMPT_SESSION_SECRET` is optional but recommended — it's what signs the login cookie. Without it, a random one is generated each time the app starts, which works fine but logs everyone out on every restart/redeploy. Generate a good one with:
```
openssl rand -hex 32
```

**If you forget the password:** there's no reset flow — just change `PROMPT_ADMIN_PASSWORD` in `.env` and restart the frontend. The old password stops working immediately.

**If `PROMPT_ADMIN_PASSWORD` isn't set at all:** the gate is off — `/prompt` is open, no login required (see toggle note above).

**Second layer — the backend itself is also locked, not just the frontend page.** The frontend's password gate only exists in the frontend; without anything on the backend's side, someone who could reach port 3001 directly (e.g. an unfirewalled VPS) could skip the password entirely. So `backend`'s own `/api/prompt` also refuses every request that doesn't carry the exact `INTERNAL_API_SECRET` value as an `x-internal-api-secret` header — a second secret, shared between the two services, that only the frontend's own proxy route knows to send. A logged-in browser never sees or sends this value itself; it's server-to-server only. Set the **same** value on both sides:
```
INTERNAL_API_SECRET=some-other-long-random-string
```
Generate one with `openssl rand -hex 32`, same as the session secret — just use a **different** value for each.

## How to update the prompt itself

**Option A — through the UI (recommended):** log into `/prompt`, edit the text, click Save. It's saved straight to SQLite and used on the very next analysis — no restart needed.

**Option B — via the API directly**, once logged in through the browser (needs that session cookie — the easiest way to do this is via your browser's dev tools "copy as curl" on a request made while logged into `/prompt`). Note this hits the **backend directly** (port 3001), so it also needs the internal secret header from above:
```bash
curl -X POST http://localhost:3001/api/prompt \
  -H "Content-Type: application/json" \
  -H "x-internal-api-secret: your-INTERNAL_API_SECRET-value" \
  -d '{"prompt": "your full prompt text here"}'
```

## First run / reset

On its very first start, if the `settings` table is empty, the backend seeds itself from `backend/prompt.txt` (see `db.js` → `seedPromptIfEmpty()`). After that first seed, `prompt.txt` is not read again — the database is the source of truth. To force a full reset back to `prompt.txt`, stop the app and delete `backend/data/app.db`, then restart.

## What the prompt is responsible for now

The prompt no longer needs to explain how to detect whether a value is in or out of range — that comparison is done deterministically in code (`lab-parser.js`) before the AI ever sees the results. The AI receives an already-classified list and is instructed never to recompute or override that status; its job is limited to writing the pedagogical (non-diagnostic) descriptions and following the required output structure.
