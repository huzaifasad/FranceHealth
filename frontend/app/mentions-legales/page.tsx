import type { Metadata } from "next"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Mentions légales | Cellude",
  description: "Mentions légales du site Cellude.",
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono text-[0.85em]">
      {children}
    </span>
  )
}

export default function LegalNoticePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-balance mb-4">Mentions légales</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Dernière mise à jour : 8 septembre 2026</p>
        </div>

        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 mb-12 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
            <p className="font-bold mb-1">À compléter avant mise en production</p>
            <p>
              La loi française (LCEN, article 6-III) impose de publier l'identité réelle et vérifiable de l'éditeur
              et de l'hébergeur d'un site. Les champs surlignés en <Placeholder>orange</Placeholder> ne sont pas des
              exemples : ils doivent être remplacés par les informations exactes de l'entreprise avant toute mise en
              ligne publique. Publier de fausses mentions légales (identité, SIRET, adresse fictifs) est lui-même
              une infraction.
            </p>
          </div>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight">
          <h2>Éditeur du site</h2>
          <p>
            <Placeholder>[Raison sociale]</Placeholder>, <Placeholder>[forme juridique]</Placeholder> au capital de{" "}
            <Placeholder>[montant]</Placeholder> €<br />
            Siège social : <Placeholder>[adresse complète]</Placeholder>
            <br />
            RCS <Placeholder>[ville]</Placeholder> n° <Placeholder>[numéro SIREN]</Placeholder>
            <br />
            SIRET : <Placeholder>[numéro SIRET]</Placeholder>
            <br />
            N° de TVA intracommunautaire : <Placeholder>[numéro]</Placeholder>
            <br />
            Téléphone : <Placeholder>[numéro]</Placeholder>
            <br />
            Email : <Placeholder>[email de contact]</Placeholder>
          </p>

          <h2>Directeur de la publication</h2>
          <p>
            <Placeholder>[Nom et fonction du responsable de la publication]</Placeholder>
          </p>

          <h2>Hébergement</h2>
          <p>
            Le site est hébergé par : <Placeholder>[Nom de l'hébergeur]</Placeholder>
            <br />
            Adresse : <Placeholder>[adresse de l'hébergeur]</Placeholder>
            <br />
            Téléphone : <Placeholder>[téléphone de l'hébergeur]</Placeholder>
          </p>
          <p>
            L'intelligence artificielle utilisée pour générer les explications pédagogiques est fournie par OpenAI,
            L.L.C. (États-Unis), en tant que sous-traitant technique — voir notre{" "}
            <Link href="/protection-des-donnees">politique de confidentialité</Link> pour le détail des transferts de
            données associés.
          </p>

          <h2>Propriété intellectuelle</h2>
          <p>
            L'ensemble des éléments de ce site (textes, structure, code, charte graphique, logo) est protégé par le
            droit de la propriété intellectuelle. Toute reproduction, représentation, modification ou exploitation,
            totale ou partielle, sans autorisation préalable écrite, est interdite.
          </p>

          <h2>Avertissement médical</h2>
          <p>
            Les explications générées par Cellude sont fournies à titre purement pédagogique et informatif. Elles ne
            constituent en aucun cas un diagnostic, un avis ou une interprétation médicale, et ne remplacent pas la
            consultation d'un professionnel de santé. Cellude décline toute responsabilité quant à l'usage qui
            pourrait être fait, en dehors de ce cadre, des informations fournies par le service.
          </p>

          <h2>Limitation de responsabilité</h2>
          <p>
            Cellude met tout en œuvre pour assurer l'exactitude et la mise à jour des informations diffusées sur ce
            site, mais ne peut garantir l'absence d'erreur. Cellude ne pourra être tenu responsable des dommages
            directs ou indirects résultant de l'accès au site ou de l'utilisation du service, notamment en cas
            d'indisponibilité temporaire.
          </p>

          <h2>Droit applicable et juridiction compétente</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. Tout litige relatif à leur
            interprétation et/ou à leur exécution relève des tribunaux français compétents.
          </p>

          <h2>Contact</h2>
          <p>
            Pour toute question relative à ces mentions légales : <Placeholder>[email de contact]</Placeholder>.
          </p>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
