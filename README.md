# FranceHealth

Two apps, one repo:

- **`frontend/`** — Next.js app (the site + the `/prompt` editor)
- **`backend/`** — Express API (PDF extraction, OpenAI call, PDF generation)

The frontend talks to the backend over HTTP. Locally/on your VPS with Docker, that's `http://backend:3001` (Docker's internal network). The backend also calls out to OpenAI directly, and separately fetches the AI system prompt from the frontend's own `/api/prompt` route.

---

## Run it locally (Docker — recommended, one command)

1. Copy the env template and fill in your real key:
   ```
   cp .env.example .env
   ```
   Edit `.env` and set `OPENAI_API_KEY=sk-...`. (`JSONBIN_*` is optional — only needed for the `/prompt` editor page to persist across restarts.)

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

Every time you change code, re-run `docker compose up -d --build` — it rebuilds only what changed.

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

## Known issue worth fixing next

`backend/server.js` always fetches the AI system prompt from `https://labresultsanalysis.vercel.app/api/prompt` — a hardcoded production URL — instead of from whichever frontend it's actually deployed alongside. Once this is running on your own VPS, the backend will still silently reach out to that separate Vercel deployment for its prompt rather than using the `/prompt` editor on the copy running next to it. Worth making that URL an env var (`PROMPT_API_URL`) pointing at `http://frontend:3000/api/prompt` in Docker, or your real domain in production.
