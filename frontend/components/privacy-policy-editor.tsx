"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Save, FileText } from "lucide-react"

// Same fetch/save/status pattern as PromptEditor, pointed at
// /api/privacy-policy instead of /api/prompt. Kept as its own component
// (not folded into PromptEditor) since it's a genuinely separate piece of
// content with its own save action — mixing the two into one save button
// would mean an edit to one field also re-saving the other.
export function PrivacyPolicyEditor() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch("/api/privacy-policy")
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
      await fetch("/api/privacy-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error("Error saving privacy policy:", error)
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
          This is the actual text shown on the public{" "}
          <code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">/protection-des-donnees</code> page —
          edits here go live immediately, no restart needed. A few light formatting rules: a line starting with{" "}
          <code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">## </code> is a section heading,
          lines starting with <code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">- </code> become
          a bullet list, and <code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">**text**</code>{" "}
          renders bold. Anything in <code className="px-1.5 py-0.5 bg-background/70 rounded text-[0.9em]">[brackets]</code> is
          a placeholder still waiting on real company info (address, SIRET, DPO email, hosting provider...) — just
          replace the bracketed text with the real value.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-border bg-muted/30 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground font-mono truncate">privacy-policy.txt</span>
        </div>

        <div className="p-3 sm:p-6">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="## 1. Section title&#10;&#10;Paragraph text..."
            className="w-full min-h-[400px] sm:min-h-[520px] bg-background border border-input rounded-lg p-3 sm:p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none font-mono text-xs sm:text-sm leading-relaxed"
            aria-label="Privacy policy editor"
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
                Save Privacy Policy
              </>
            )}
          </Button>
        </div>
      </div>

      <a
        href="/protection-des-donnees"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <FileText className="w-4 h-4" />
        View the live page in a new tab
      </a>
    </div>
  )
}
