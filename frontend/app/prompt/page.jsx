import { cookies } from "next/headers"
import { verifySessionToken, isAdminPasswordConfigured, SESSION_COOKIE_NAME } from "@/lib/auth"
import { PromptLogin } from "@/components/prompt-login"
import { PromptEditor } from "@/components/prompt-editor"

export default async function PromptPage() {
  const cookieStore = await cookies()
  const authenticated = verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value)

  if (!authenticated) {
    return <PromptLogin passwordConfigured={isAdminPasswordConfigured()} />
  }

  return <PromptEditor />
}
