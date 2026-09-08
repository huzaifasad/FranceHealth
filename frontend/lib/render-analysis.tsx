"use client"

// Turns the AI's report text into an actual structured UI instead of one
// centered wall of text. The AI still writes free text following a fixed
// structure (numbered sections, "•" bullets, "---" category headers) — this
// parses that structure and, crucially, reads each item's color from the
// CODE-computed `classification` (never from string-matching which section
// the AI put it under), the same principle used for the PDF's coloring.

import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react"

export type ClassificationEntry = {
  value: number | null
  unit: string
  rangeText: string
  status: "NORMAL" | "ABOVE" | "BELOW" | "UNPARSED"
}
export type ClassificationItem = {
  name: string
  status: "NORMAL" | "ABOVE" | "BELOW" | "UNPARSED"
  entries: ClassificationEntry[]
}

function normalizeName(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function buildLookup(classification: ClassificationItem[]) {
  const map = new Map<string, ClassificationItem["status"]>()
  for (const r of classification || []) {
    if (r.status === "UNPARSED") continue
    map.set(normalizeName(r.name), r.status)
  }
  return map
}

function lookupStatus(map: Map<string, ClassificationItem["status"]>, rawName: string) {
  const norm = normalizeName(rawName)
  if (map.has(norm)) return map.get(norm)!
  let match: ClassificationItem["status"] | null = null
  let hits = 0
  for (const [key, status] of map) {
    if (norm.includes(key) || key.includes(norm)) {
      match = status
      hits++
    }
  }
  return hits === 1 ? match : null
}

type Card = { name: string; detailLines: string[]; status: "NORMAL" | "ABOVE" | "BELOW" | null }
type Block =
  | { kind: "sectionHeader"; title: string; tone: "abnormal" | "normal" | "recap" }
  | { kind: "categoryHeader"; title: string }
  | { kind: "card"; card: Card }
  | { kind: "paragraph"; text: string }

function parseBlocks(analysis: string): Block[] {
  const lines = analysis.split("\n")
  const blocks: Block[] = []
  let currentCard: Card | null = null
  let stopped = false

  const flush = () => {
    if (currentCard) {
      blocks.push({ kind: "card", card: currentCard })
      currentCard = null
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (stopped) break
    if (!line || line.includes("====")) continue

    if (/^\d+\.\s+[A-ZÉÈÊ]/.test(line)) {
      flush()
      if (line.includes("DEHORS")) blocks.push({ kind: "sectionHeader", title: line.replace(/^\d+\.\s*/, ""), tone: "abnormal" })
      else if (line.includes("DANS")) blocks.push({ kind: "sectionHeader", title: line.replace(/^\d+\.\s*/, ""), tone: "normal" })
      else if (line.includes("RÉCAPITULATIF") || line.includes("RECAPITULATIF"))
        blocks.push({ kind: "sectionHeader", title: line.replace(/^\d+\.\s*/, ""), tone: "recap" })
      continue
    }

    if (/^RAPPEL IMPORTANT/i.test(line)) {
      // Already covered by the static disclaimer Alert below — stop here.
      flush()
      stopped = true
      break
    }

    if (line.startsWith("---")) {
      flush()
      blocks.push({ kind: "categoryHeader", title: line.replace(/^---\s*/, "") })
      continue
    }

    if (line.startsWith("•") || line.startsWith("*") || line.startsWith("-")) {
      flush()
      currentCard = { name: line.replace(/^[•*-]\s*/, ""), detailLines: [], status: null }
      continue
    }

    // Category label like "Fonction rénale (reins) :" with no bullet
    if (/^[A-ZÉÈÊ].*:$/.test(line) && !/^(Vue|Nombre|Catégories)/.test(line) && !currentCard) {
      flush()
      blocks.push({ kind: "categoryHeader", title: line.replace(/:$/, "") })
      continue
    }

    if (currentCard) {
      currentCard.detailLines.push(line)
      continue
    }

    // Free paragraph text (overview / récap content)
    blocks.push({ kind: "paragraph", text: line })
  }
  flush()

  return blocks
}

const statusStyle = {
  ABOVE: {
    border: "border-l-red-400 dark:border-l-red-500",
    bg: "bg-red-50/60 dark:bg-red-950/20",
    icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
    badge: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50",
  },
  BELOW: {
    border: "border-l-red-400 dark:border-l-red-500",
    bg: "bg-red-50/60 dark:bg-red-950/20",
    icon: <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />,
    badge: "text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-950/50",
  },
  NORMAL: {
    border: "border-l-emerald-400 dark:border-l-emerald-500",
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    badge: "text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50",
  },
  UNKNOWN: {
    border: "border-l-border",
    bg: "bg-muted/30",
    icon: <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0" />,
    badge: "text-muted-foreground bg-muted",
  },
} as const

function ResultCard({ card, lookup }: { card: Card; lookup: Map<string, ClassificationItem["status"]> }) {
  // Name may carry ": value (repères: ...)" inline for normal-section items.
  const [namePart, ...rest] = card.name.split(":")
  const inlineValue = rest.length ? rest.join(":").trim() : null

  const computed = lookupStatus(lookup, namePart)
  const style = computed === "ABOVE" || computed === "BELOW" ? statusStyle[computed] : computed === "NORMAL" ? statusStyle.NORMAL : statusStyle.UNKNOWN

  const detailMap: Record<string, string> = {}
  let definition = ""
  for (const line of card.detailLines) {
    const m = line.match(/^(Votre résultat|Repères du laboratoire|Position)\s*:\s*(.*)$/i)
    if (m) {
      detailMap[m[1]] = m[2]
    } else if (/^Qu'est-ce que c'est/i.test(line)) {
      continue
    } else {
      definition += (definition ? " " : "") + line
    }
  }

  return (
    <div className={`rounded-xl border-l-4 ${style.border} ${style.bg} p-4 sm:p-5`}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="flex items-center gap-2">
          {style.icon}
          <h4 className="font-bold text-sm sm:text-base text-foreground">{namePart.trim()}</h4>
        </div>
        {computed && (
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${style.badge}`}>
            {computed === "NORMAL" ? "Dans les repères" : "Hors repères"}
          </span>
        )}
      </div>

      {inlineValue && <p className="text-sm text-muted-foreground mb-1.5 ml-6">{inlineValue}</p>}

      {(detailMap["Votre résultat"] || detailMap["Repères du laboratoire"]) && (
        <div className="ml-6 mb-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {detailMap["Votre résultat"] && (
            <span>
              <span className="text-muted-foreground">Votre résultat : </span>
              <span className="font-semibold text-foreground">{detailMap["Votre résultat"]}</span>
            </span>
          )}
          {detailMap["Repères du laboratoire"] && (
            <span>
              <span className="text-muted-foreground">Repères : </span>
              <span className="font-medium text-foreground">{detailMap["Repères du laboratoire"]}</span>
            </span>
          )}
        </div>
      )}

      {definition && <p className="ml-6 text-sm text-foreground/80 leading-relaxed">{definition}</p>}
    </div>
  )
}

export function AnalysisReport({ analysis, classification }: { analysis: string; classification?: ClassificationItem[] }) {
  const lookup = buildLookup(classification || [])
  const blocks = parseBlocks(analysis)

  return (
    <div className="space-y-5 sm:space-y-6">
      {blocks.map((block, i) => {
        if (block.kind === "sectionHeader") {
          if (block.tone === "recap") {
            return (
              <h3 key={i} className="text-lg sm:text-xl font-black tracking-tight text-foreground pt-2">
                {block.title}
              </h3>
            )
          }
          const isAbnormal = block.tone === "abnormal"
          return (
            <div key={i} className="flex items-center gap-2 pt-2">
              {isAbnormal ? (
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0" />
              )}
              <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">{block.title}</h3>
            </div>
          )
        }
        if (block.kind === "categoryHeader") {
          return (
            <h4 key={i} className="text-xs sm:text-sm font-bold uppercase tracking-widest text-accent pt-1">
              {block.title}
            </h4>
          )
        }
        if (block.kind === "card") {
          return <ResultCard key={i} card={block.card} lookup={lookup} />
        }
        return (
          <p key={i} className="text-sm sm:text-base text-foreground/85 leading-relaxed">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}
