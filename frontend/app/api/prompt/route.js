// Thin proxy to the backend's own /api/prompt (SQLite-backed — see
// backend/db.js). Kept as a same-origin route so the client-side /prompt
// page can keep calling a relative "/api/prompt" URL; this route just
// forwards server-side to whichever backend NEXT_PUBLIC_API_URL points at
// (the Docker service name in production, localhost in local dev).
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

export async function GET() {
  try {
    const response = await fetch(`${API_URL}/api/prompt`, { cache: "no-store" })
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
  try {
    const body = await request.json()
    const response = await fetch(`${API_URL}/api/prompt`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
