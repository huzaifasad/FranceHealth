"use client"

import { useEffect, useState } from "react"
import { FileSearch, FileCheck2, BrainCircuit, Sparkles } from "lucide-react"

// There's no real byte-level progress to report from a single opaque HTTP
// call to the analyze endpoint — so this simulates staged progress on an
// eased curve that approaches (but never reaches) a cap on its own. Only
// the parent setting `complete` (once the real response has actually come
// back) snaps it the rest of the way to 100%. This is the same "staged
// fake progress" pattern used by most CI/deploy UIs for exactly this
// reason: it communicates real forward motion without lying about
// certainty we don't have.
const STAGES = [
  { label: "Lecture du document...", icon: FileSearch, upTo: 22 },
  { label: "Extraction des valeurs biologiques...", icon: FileCheck2, upTo: 42 },
  { label: "Analyse par l'intelligence artificielle...", icon: BrainCircuit, upTo: 90 },
  { label: "Génération de votre rapport...", icon: Sparkles, upTo: 100 },
]
const CAP = 95
const EASE_SECONDS = 9

export function AnalysisProgress({ active, complete }: { active: boolean; complete?: boolean }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!active) {
      setProgress(0)
      return
    }
    if (complete) {
      setProgress(100)
      return
    }
    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000
      setProgress(Math.min(CAP * (1 - Math.exp(-elapsed / EASE_SECONDS)), CAP))
    }, 100)
    return () => clearInterval(id)
  }, [active, complete])

  if (!active) return null

  const stage = STAGES.find((s) => progress < s.upTo) || STAGES[STAGES.length - 1]
  const Icon = stage.icon

  return (
    <div className="mt-5 sm:mt-6 space-y-2.5 animate-in fade-in duration-300">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-foreground">
        <Icon className="w-4 h-4 text-accent shrink-0" />
        <span>{stage.label}</span>
        <span className="ml-auto text-muted-foreground font-mono text-xs tabular-nums">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
