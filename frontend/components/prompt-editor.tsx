"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, Code, LogOut, ArrowLeft, Info, Sparkles, ShieldCheck, CheckSquare } from "lucide-react"
import { PrivacyPolicyEditor } from "@/components/privacy-policy-editor"
import { ConsentTextEditor } from "@/components/consent-text-editor"

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
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 sm:mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

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

        {/* Guide -- what each tab below actually controls, and where it shows up on the real site */}
        <div className="mb-8 sm:mb-10 rounded-xl border border-border overflow-hidden">
          <div className="px-4 sm:px-6 py-3 bg-muted/40 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">Guide — three editable areas, one page</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              All three save straight to the database and go live immediately — no restart, no redeploy, no code.
            </p>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">Prompt IA</span>{" "}
                <span className="text-muted-foreground">— how the AI writes each analysis explanation (tone, structure, what it's allowed to say). Never decides in/out-of-range status, only the wording. Shows up: right after someone uploads a PDF on the homepage.</span>
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-accent" />
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">Politique de confidentialité</span>{" "}
                <span className="text-muted-foreground">— the full legal text: company identity, data retention, rights, etc. Shows up: the public </span>
                <code className="px-1.5 py-0.5 bg-muted rounded text-[0.85em]">/protection-des-donnees</code> page, linked from the footer and the homepage's consent checkbox.
              </div>
            </div>
            <div className="flex items-start gap-3 sm:gap-4 px-4 sm:px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckSquare className="w-4 h-4 text-accent" />
              </div>
              <div className="text-sm">
                <span className="font-semibold text-foreground">Texte de consentement</span>{" "}
                <span className="text-muted-foreground">— the one-line label next to the checkbox someone must tick before analyzing. Shows up: homepage, directly under the "Analyser mes résultats" button.</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="prompt">
          <TabsList className="mb-6 sm:mb-8">
            <TabsTrigger value="prompt">Prompt IA</TabsTrigger>
            <TabsTrigger value="privacy">Politique de confidentialité</TabsTrigger>
            <TabsTrigger value="consent">Texte de consentement</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt">
            {/* How it works */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-lg border border-accent/30 bg-accent/5 flex gap-3 sm:gap-4">
              <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-2">
                <p>
                  <strong>This prompt controls only how the AI writes its explanations</strong> — tone, structure, and
                  what it's allowed to say. It does <strong>not</strong> decide whether a value is in or out of range.
                </p>
                <p>
                  That classification is already computed in code (<code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">lab-parser.js</code>) before the AI ever sees the
                  results — the AI receives an already-labeled list and is instructed never to recompute or override it. A
                  bad prompt edit can only produce a worse-written explanation, never a wrong in/out-of-range result.
                </p>
                <p className="text-muted-foreground">
                  Changes here apply to the very next analysis — no restart, no redeploy needed.
                </p>
              </div>
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
          </TabsContent>

          <TabsContent value="privacy">
            <PrivacyPolicyEditor />
          </TabsContent>

          <TabsContent value="consent">
            <ConsentTextEditor />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
