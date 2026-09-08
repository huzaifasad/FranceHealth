# FranceHealth

Two apps, one repo:

- **`frontend/`** — Next.js app (the site + the `/prompt` editor)
- **`backend/`** — Express API (PDF extraction, deterministic in/out-of-range classification, OpenAI call, PDF generation, prompt storage)

The frontend talks to the backend over HTTP for the analyze flow. Locally/on your VPS with Docker, that's `http://backend:3001` (Docker's internal network). The system prompt lives in the **backend's own SQLite database** (`backend/data/app.db`) — the frontend's `/prompt` page and `/api/prompt` route are just a thin editor UI/proxy on top of it, nothing is stored on the frontend side anymore.

**PDF upload only** — there is no manual data-entry form. In/out-of-range status for each result is computed in code (`backend/lab-parser.js`), never by the AI — the AI only writes the pedagogical description using the status it's given.

---

## Run it locally (Docker — recommended, one command)

1. Copy the env template and fill in your real key:
   ```
   cp .env.example .env
   ```
   Edit `.env` and set `OPENAI_API_KEY=sk-...`. That's the only required secret now.

2. Build and start both apps:
   ```
   docker compose up -d --build
   ```

3. Open:
   - Frontend: http://localhost:3000
   - Backend health check: http://localhost:3001/health

4. To stop:
   ```
   docker compose down
   ```

Every time you change code, re-run `docker compose up -d --build` — it rebuilds only what changed. The SQLite prompt data lives in a named Docker volume (`backend_data`), so it survives rebuilds, restarts, and redeploys.

---

## Run it locally (no Docker)

**Backend:**
```
cd backend
npm install
cp ../.env.example .env    # fill in OPENAI_API_KEY
npm start
```

**Frontend** (separate terminal):
```
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev
```

> Requires Node.js **22.5+** (the backend uses the built-in `node:sqlite` module — no native compilation, works the same on Windows/macOS/Linux). The Docker images already pin Node 24.

---

## Editing the AI prompt

Open `/prompt` on the running frontend, edit, click Save. It's saved straight into the backend's SQLite database and used on the very next analysis — no third-party service, no restart needed, and it survives restarts/redeploys. See `backend/README.md` for the API-only way (`curl`) and how the first-run seed works.

---

## Deploying to your own VPS

### One-time VPS setup

**Option A — Docker (recommended):**
```bash
# On the VPS
sudo apt update && sudo apt install -y docker.io docker-compose-plugin git
sudo mkdir -p /opt/francehealth
sudo chown $USER:$USER /opt/francehealth
git clone https://github.com/huzaifasad/FranceHealth.git /opt/francehealth
cd /opt/francehealth
cp .env.example .env
nano .env   # fill in your real OPENAI_API_KEY
docker compose up -d --build
```

**Option B — No Docker (PM2):**
```bash
# On the VPS
sudo apt update && sudo apt install -y nodejs npm git
sudo npm i -g pm2
sudo mkdir -p /opt/francehealth
sudo chown $USER:$USER /opt/francehealth
git clone https://github.com/huzaifasad/FranceHealth.git /opt/francehealth
cd /opt/francehealth
cd backend && npm install && cp ../.env.example .env && nano .env && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 start ecosystem.config.js
pm2 save && pm2 startup   # follow the printed command so it survives a reboot
```

Only pick **one** of these two — they both try to use ports 3000/3001 on the VPS.

### Automatic deploys (CI/CD via GitHub Actions)

Already wired up in `.github/workflows/deploy.yml` for the **Docker** path — on every push to `main`, GitHub Actions SSHes into your VPS, pulls the latest code, and runs `docker compose up -d --build` for you. You don't run anything by hand after the first setup.

To enable it, add these **repository secrets** (GitHub repo → Settings → Secrets and variables → Actions → New repository secret):

| Secret | Value |
|---|---|
| `VPS_HOST` | Your VPS IP or domain |
| `VPS_USER` | SSH username (e.g. `deploy` or `root`) |
| `VPS_SSH_KEY` | The **private** key for a keypair whose **public** key is in that user's `~/.ssh/authorized_keys` on the VPS. Generate a dedicated deploy key — don't reuse your personal one. |
| `VPS_PORT` | SSH port (optional, defaults to 22) |
| `VPS_APP_DIR` | Path to the repo on the VPS (optional, defaults to `/opt/francehealth`) |

Generate a deploy keypair (on your own machine, not in chat):
```
ssh-keygen -t ed25519 -f deploy_key -N ""
```
Then append `deploy_key.pub` to the VPS user's `~/.ssh/authorized_keys`, and paste the contents of `deploy_key` (the private half) into the `VPS_SSH_KEY` secret.

**If you'd rather use the no-Docker (PM2) path in CI instead:** delete `.github/workflows/deploy.yml`, then rename `.github/workflows/deploy-no-docker.yml.example` to `deploy.yml`. Same secrets, different deploy commands.

From then on: **push to `main` → it's live.** That's the "one command" — `git push`.

---

## What changed recently (and why)

- **Renamed "Avencio Health" → "FranceHealth"** everywhere it showed up: UI, PDF header/footer, page titles, `package.json` names, log lines.
- **Prompt storage moved off JSONBin, into the backend's own SQLite database.** The old design stored a JSONBin "bin id" in memory (`let binId`), which was wiped on every restart/redeploy, and the deployed frontend was found returning the placeholder "Welcome! ..." text instead of the real prompt. SQLite on a Docker volume actually persists.
- **In/out-of-range is decided in code, not by the AI.** This was the cause of results randomly coming back marked all-abnormal — the model was doing its own (inconsistent) number parsing and comparison every time. `backend/lab-parser.js` now does that deterministically before the AI ever sees the results; the AI is instructed to use the status it's given and never recompute it.
- **Manual data-entry form removed.** PDF upload is the only input now, on both the UI and the server action.
