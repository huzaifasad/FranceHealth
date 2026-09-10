import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AlertTriangle } from "lucide-react"
import { renderPolicyText } from "@/lib/policy-markdown"

export const metadata: Metadata = {
  title: "Protection des données | Cellude",
  description: "Politique de confidentialité et protection des données personnelles conforme au RGPD.",
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Force this page to render fresh on every request rather than being
// statically optimized -- otherwise an edit made on /prompt wouldn't show
// up here until the next full rebuild, defeating the point of it being
// live-editable.
export const dynamic = "force-dynamic"

async function getPolicy() {
  try {
    const res = await fetch(`${API_URL}/api/privacy-policy`, {
      cache: "no-store",
      headers: { "x-internal-api-secret": process.env.INTERNAL_API_SECRET || "" },
    })
    const data = await res.json()
    return { content: data.content || "", updatedAt: data.updatedAt || null }
  } catch {
    return { content: "", updatedAt: null }
  }
}

export default async function DataProtectionPage() {
  const { content, updatedAt } = await getPolicy()
  const lastUpdated = updatedAt
    ? new Date(updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-balance mb-4">
            Politique de confidentialité
          </h1>
          {lastUpdated && <p className="text-muted-foreground text-sm sm:text-base">Dernière mise à jour : {lastUpdated}</p>}
        </div>

        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 mb-12 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
            <p className="font-bold mb-1">À compléter avant mise en production</p>
            <p>
              Ce document reprend la structure exigée par le RGPD (identité du responsable de traitement, base
              légale, sous-traitants, durées de conservation, droits des personnes). Les champs entre{" "}
              <span className="font-mono text-[0.9em]">[crochets]</span> doivent être remplacés par les informations
              réelles de l'entreprise — modifiable directement sur{" "}
              <span className="font-mono text-[0.9em]">/prompt</span>, onglet « Politique de confidentialité ». Le
              traitement de données de santé (catégorie particulière au sens de l'article 9 du RGPD) justifie en
              outre une relecture par un juriste ou un DPO avant mise en ligne.
            </p>
          </div>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-accent">
          {content ? renderPolicyText(content) : <p className="text-muted-foreground">Contenu à venir.</p>}
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
