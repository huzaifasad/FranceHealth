import crypto from "crypto"

// Gates /prompt (the AI system-prompt editor). One shared admin password,
// stored the same way every other secret in this app is: PROMPT_ADMIN_PASSWORD
// in .env, never in git, never in a database — this protects a single shared
// value, not many users' credentials, so there's no real DB-leak scenario
// hashing would defend against here that .env doesn't already.

export const SESSION_COOKIE_NAME = "celluid_prompt_session"
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24h
export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000

// If PROMPT_SESSION_SECRET isn't set, fall back to a random secret generated
// once per process. This is a safe default (fail closed): sessions just
// won't survive a restart, rather than silently trusting something weaker.
let ephemeralSecret: string | null = null
function getSessionSecret(): string {
  if (process.env.PROMPT_SESSION_SECRET) return process.env.PROMPT_SESSION_SECRET
  if (!ephemeralSecret) {
    ephemeralSecret = crypto.randomBytes(32).toString("hex")
    console.warn(
      "[auth] PROMPT_SESSION_SECRET is not set — using a random in-memory secret. " +
        "Sessions will be invalidated on every restart. Set PROMPT_SESSION_SECRET in .env for persistent sessions."
    )
  }
  return ephemeralSecret
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex")
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export function isAdminPasswordConfigured(): boolean {
  return !!process.env.PROMPT_ADMIN_PASSWORD
}

export function checkPassword(candidate: string): boolean {
  const real = process.env.PROMPT_ADMIN_PASSWORD
  if (!real) return false
  return timingSafeStringEqual(candidate, real)
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_MS
  const payload = String(expiresAt)
  return `${payload}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const [payload, signature] = token.split(".")
  if (!payload || !signature) return false
  if (!timingSafeStringEqual(signature, sign(payload))) return false
  const expiresAt = Number(payload)
  return Number.isFinite(expiresAt) && Date.now() < expiresAt
}
