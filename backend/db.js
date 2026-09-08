const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");

// Persisted on disk (mounted as a Docker volume in production) so the
// prompt survives restarts and redeploys — this is the whole point of
// moving off JSONBin: a real local database instead of a third-party
// service with a bin id that lived in memory and evaporated on restart.
//
// Uses Node's built-in "node:sqlite" module (needs Node >= 22.5) instead of
// a native dependency like better-sqlite3 — nothing to compile, works the
// same on Windows dev machines, CI runners, and the Docker image.
const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, "app.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

const PROMPT_KEY = "system_prompt";

function getPrompt() {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(PROMPT_KEY);
  return row ? row.value : null;
}

function setPrompt(value) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(PROMPT_KEY, value, new Date().toISOString());
}

function getPromptUpdatedAt() {
  const row = db.prepare("SELECT updated_at FROM settings WHERE key = ?").get(PROMPT_KEY);
  return row ? row.updated_at : null;
}

// Seed with the real prompt on first run so the app never falls back to a
// generic placeholder — only happens once, the first time app.db is created.
function seedPromptIfEmpty() {
  if (getPrompt() !== null) return;
  const seedPath = path.join(__dirname, "prompt.txt");
  const seedText = fs.existsSync(seedPath)
    ? fs.readFileSync(seedPath, "utf8")
    : "Welcome! This is your default prompt. Edit it above and save.";
  setPrompt(seedText);
  console.log("🌱 Seeded system prompt from prompt.txt into SQLite (first run).");
}

seedPromptIfEmpty();

module.exports = { getPrompt, setPrompt, getPromptUpdatedAt };
