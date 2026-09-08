import { NextResponse } from "next/server"
import {
  checkPassword,
  createSessionToken,
  isAdminPasswordConfigured,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth"

export async function POST(request) {
  if (!isAdminPasswordConfigured()) {
    return NextResponse.json(
      { success: false, error: "Aucun mot de passe n'est configuré côté serveur (PROMPT_ADMIN_PASSWORD manquant)." },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => null)
  const password = body?.password

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ success: false, error: "Mot de passe requis." }, { status: 400 })
  }

  if (!checkPassword(password)) {
    return NextResponse.json({ success: false, error: "Mot de passe incorrect." }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
  return response
}
