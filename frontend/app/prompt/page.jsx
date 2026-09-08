import { cookies } from "next/headers"
import { verifySessionToken, isAdminPasswordConfigured, SESSION_COOKIE_NAME } from "@/lib/auth"
import { PromptLogin } from "@/components/prompt-login"
import { PromptEditor } from "@/components/prompt-editor"

// Force this page to render fresh on every request instead of being
// statically optimized. Without this, the "no password configured"
// branch below never touches cookies() and Next.js can pre-render the
// page once at build time — meaning setting PROMPT_ADMIN_PASSWORD again
// later and just restarting (not rebuilding) wouldn't actually bring the
// gate back, which defeats the point of this being a live toggle.
export const dynamic = "force-dynamic"

export default async function PromptPage() {
  // No PROMPT_ADMIN_PASSWORD set -> the gate is off entirely, open to
  // anyone. Set it again any time to bring back the exact same
  // password + session protection, with nothing to rebuild.
  if (!isAdminPasswordConfigured()) {
    return <PromptEditor />
  }

  const cookieStore = await cookies()
  const authenticated = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)

  if (!authenticated) {
    return <PromptLogin passwordConfigured={true} />
  }

  return <PromptEditor />
}
