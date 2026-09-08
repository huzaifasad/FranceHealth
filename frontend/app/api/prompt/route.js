// Thin proxy to the backend's own /api/prompt (SQLite-backed — see
// backend/db.js). Kept as a same-origin route so the client-side /prompt
// page can keep calling a relative "/api/prompt" URL; this route just
// forwards server-side to whichever backend NEXT_PUBLIC_API_URL points at
// (the Docker service name in production, localhost in local dev).
//
// Gated: both reading and writing the prompt require a valid session —
// reading it too, not just Save, since the prompt text itself reveals
// exactly how the AI's safety instructions are worded.
import { cookies } from "next/headers"
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

async function isAuthenticated() {
  const cookieStore = await cookies()
  return verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ success: false, error: "Non autorisé." }, { status: 401 })
  }

  try {
    const response = await fetch(`${API_URL}/api/prompt`, {
      cache: "no-store",
      headers: { "x-internal-api-secret": process.env.INTERNAL_API_SECRET || "" },
    })
    const data = await response.json()
    return Response.json(data, { status: response.status })
  } catch (error) {
    return Response.json(
      { success: false, error: "Impossible de joindre le serveur d'analyse pour lire le prompt." },
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
    const response = await fetch(`${API_URL}/api/prompt`, {
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
      { success: false, error: "Impossible de joindre le serveur d'analyse pour sauvegarder le prompt." },
      { status: 502 }
    )
  }
}
