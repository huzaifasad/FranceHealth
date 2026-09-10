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

// Generic key-value helpers -- both the AI system prompt and the privacy
// policy text are just named rows in the same "settings" table, so they
// share this one implementation instead of duplicating the same three
// functions per field.
function getSetting(key) {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? row.value : null;
}

function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, value, new Date().toISOString());
}

function getSettingUpdatedAt(key) {
  const row = db.prepare("SELECT updated_at FROM settings WHERE key = ?").get(key);
  return row ? row.updated_at : null;
}

// Seeds a setting from a local seed file, once -- only the very first time
// app.db is created for that key, so the app never falls back to a generic
// placeholder, and never overwrites a real edit made after that.
function seedIfEmpty(key, seedFileName, fallbackText, label) {
  if (getSetting(key) !== null) return;
  const seedPath = path.join(__dirname, seedFileName);
  const seedText = fs.existsSync(seedPath) ? fs.readFileSync(seedPath, "utf8") : fallbackText;
  setSetting(key, seedText);
  console.log(`🌱 Seeded ${label} from ${seedFileName} into SQLite (first run).`);
}

const PROMPT_KEY = "system_prompt";
const PRIVACY_POLICY_KEY = "privacy_policy";
const CONSENT_TEXT_KEY = "consent_text";

const getPrompt = () => getSetting(PROMPT_KEY);
const setPrompt = (value) => setSetting(PROMPT_KEY, value);
const getPromptUpdatedAt = () => getSettingUpdatedAt(PROMPT_KEY);

const getPrivacyPolicy = () => getSetting(PRIVACY_POLICY_KEY);
const setPrivacyPolicy = (value) => setSetting(PRIVACY_POLICY_KEY, value);
const getPrivacyPolicyUpdatedAt = () => getSettingUpdatedAt(PRIVACY_POLICY_KEY);

const getConsentText = () => getSetting(CONSENT_TEXT_KEY);
const setConsentText = (value) => setSetting(CONSENT_TEXT_KEY, value);
const getConsentTextUpdatedAt = () => getSettingUpdatedAt(CONSENT_TEXT_KEY);

seedIfEmpty(PROMPT_KEY, "prompt.txt", "Welcome! This is your default prompt. Edit it above and save.", "system prompt");
seedIfEmpty(
  PRIVACY_POLICY_KEY,
  "privacy-policy.txt",
  "## Politique de confidentialité\n\nÀ compléter.",
  "privacy policy"
);
seedIfEmpty(
  CONSENT_TEXT_KEY,
  "consent-text.txt",
  "J'accepte la [politique de confidentialité](/protection-des-donnees) et le traitement de mes données de santé par IA",
  "consent checkbox text"
);

module.exports = {
  getPrompt,
  setPrompt,
  getPromptUpdatedAt,
  getPrivacyPolicy,
  setPrivacyPolicy,
  getPrivacyPolicyUpdatedAt,
  getConsentText,
  setConsentText,
  getConsentTextUpdatedAt,
};
