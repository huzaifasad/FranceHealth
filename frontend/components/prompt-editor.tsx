"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, Code, LogOut } from "lucide-react"

export function PromptEditor() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load the current prompt on mount
  useEffect(() => {
    fetch("/api/prompt")
      .then((res) => res.json())
      .then((data) => {
        setPrompt(data.prompt || "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      await fetch("/api/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("[v0] Error saving prompt:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20">
        {/* Header */}
        <div className="mb-8 sm:mb-12 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-foreground rounded-lg flex items-center justify-center shrink-0">
                <Code className="w-4 h-4 sm:w-5 sm:h-5 text-background" />
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-balance">
                prompt <span className="text-muted-foreground">engineering.</span>
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-lg">
              Edit and manage your prompts. Access via{" "}
              <code className="px-2 py-1 bg-muted rounded text-xs sm:text-sm break-all">/api/prompt</code>
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="rounded-xl gap-2 shrink-0">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>

        {/* Editor Card */}
        <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground font-mono truncate">prompt.txt</span>
          </div>

          <div className="p-3 sm:p-6">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="w-full min-h-[300px] sm:min-h-[400px] bg-background border border-input rounded-lg p-3 sm:p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-xs sm:text-sm leading-relaxed"
              aria-label="Prompt editor"
            />
          </div>

          <div className="border-t border-border bg-muted/20 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">{prompt.length} characters</div>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-foreground text-background hover:brightness-110 w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2"></div>
                  Saving...
                </>
              ) : saved ? (
                <>
                  <div className="w-4 h-4 mr-2 text-green-500">✓</div>
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Prompt
                </>
              )}
            </Button>
          </div>
        </div>

        {/* API Info */}
        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-muted/50 rounded-lg border border-border">
          <h2 className="text-base sm:text-lg font-semibold mb-3 text-foreground">API Access</h2>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="break-all">
              <span className="text-muted-foreground">GET </span>
              <code className="px-2 py-1 bg-background rounded text-foreground">/api/prompt</code>
              <span className="text-muted-foreground sm:ml-2 block sm:inline">- Retrieve prompt as JSON (requires an authenticated session)</span>
            </div>
            <div className="break-all">
              <span className="text-muted-foreground">POST </span>
              <code className="px-2 py-1 bg-background rounded text-foreground">/api/prompt</code>
              <span className="text-muted-foreground sm:ml-2 block sm:inline">- Update prompt (requires an authenticated session)</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
