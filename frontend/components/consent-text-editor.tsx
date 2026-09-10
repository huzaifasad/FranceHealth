"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, ExternalLink } from "lucide-react"

// Same fetch/save/status pattern as PromptEditor and PrivacyPolicyEditor,
// pointed at /api/consent-text. Kept as its own small component for the
// same reason PrivacyPolicyEditor is separate from PromptEditor: a genuinely
// separate piece of content, its own save action.
export function ConsentTextEditor() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/consent-text")
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content || "")
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await fetch("/api/consent-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving consent text:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 p-4 sm:p-5 rounded-lg border border-accent/30 bg-accent/5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
        <p>
          This is the small consent line shown next to the checkbox on the homepage, right below the "Analyser mes
          résultats" button — required before anyone can run an analysis (it's the legal basis for processing health
          data, so it can't be removed, only reworded). One formatting rule:{" "}
          <code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">[link text](/some-path)</code> becomes a
          real clickable link — that's how the "politique de confidentialité" link to the privacy policy page is
          built. Keep exactly one such link if you reword this, so people can still actually read the policy before
          accepting it.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground font-mono truncate">consent-text.txt</span>
        </div>

        <div className="p-3 sm:p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="J'accepte la [politique de confidentialité](/protection-des-donnees) et..."
            className="w-full min-h-[100px] bg-background border border-input rounded-lg p-3 sm:p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-xs sm:text-sm leading-relaxed"
            aria-label="Consent text editor"
          />
        </div>

        <div className="border-t border-border bg-muted/20 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">{content.length} characters</div>
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
                Save Consent Text
              </>
            )}
          </Button>
        </div>
      </div>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ExternalLink className="w-4 h-4" />
        View the live homepage in a new tab
      </a>
    </div>
  )
}
