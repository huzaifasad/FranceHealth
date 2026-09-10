// Thin proxy to the backend's own /api/consent-text (SQLite-backed — see
// backend/db.js). Same shape as app/api/privacy-policy/route.js: GET is
// never gated (the consent checkbox label is public content, rendered on
// the homepage before every analysis, not something to hide behind a
// login) while POST still goes through the same admin gate as the prompt,
// respecting the PROMPT_ADMIN_PASSWORD toggle.
import { cookies } from "next/headers"
import { verifySessionToken, isAdminPasswordConfigured, SESSION_COOKIE_NAME } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function isAuthenticated() {
  if (!isAdminPasswordConfigured()) return true
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/consent-text`, {
      cache: "no-store",
      headers: { "x-internal-api-secret": process.env.INTERNAL_API_SECRET || "" },
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    return Response.json(
      { success: false, error: "Impossible de joindre le serveur pour lire le texte de consentement." },
      { status: 502 }
    )
  }
}

export async function POST(request) {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, error: "Non autorisé." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const response = await fetch(`${API_URL}/api/consent-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify(body),
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    return Response.json(
      { success: false, error: "Impossible de joindre le serveur pour sauvegarder le texte de consentement." },
      { status: 502 }
    )
  }
}
