import { AnalyzerForm } from "@/components/analyzer-form"
import { SiteHeader } from "@/components/site-header"
import type { Metadata } from "next"
import { HeartPulse } from "lucide-react"

export const metadata: Metadata = {
  title: "Celluid | Analyseur de Résultats Biologiques Intelligent",
  description:
    "Comprenez vos analyses médicales en un instant grâce à notre IA sécurisée. Téléchargez votre PDF et recevez une explication claire.",
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      <SiteHeader />

      <section className="relative pt-14 pb-16 sm:pt-20 sm:pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[radial-gradient(ellipse_at_center,var(--accent)_0%,transparent_60%)] opacity-[0.08] -z-10 blur-3xl" />
        <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -z-10" />
        <div className="absolute bottom-20 left-10 w-[350px] h-[350px] bg-accent/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6 sm:space-y-8">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-primary/5 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5 text-primary text-[10px] sm:text-xs font-black tracking-[0.15em] sm:tracking-[0.2em] uppercase mb-2 sm:mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-accent shadow-lg shadow-accent/50"></span>
            </span>
            Technologie IA Sécurisée
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] sm:leading-[0.95] text-balance">
            La clarté pour <br />
            <span className="inline-block mt-1 sm:mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent [background-size:200%] animate-[gradient_8s_ease_infinite] italic">
              votre santé.
            </span>
          </h1>

          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed text-pretty px-2 sm:px-0">
            Téléchargez votre compte-rendu PDF pour une explication claire et instantanée.
          </p>

          <div className="pt-4 sm:pt-8">
            <AnalyzerForm />
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-footer via-footer to-footer/95 text-footer-foreground pt-16 pb-10 sm:pt-24 sm:pb-12 rounded-t-[2rem] sm:rounded-t-[3rem] shadow-2xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 md:gap-16 pb-12 sm:pb-16 md:pb-20 border-b border-footer-foreground/10">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-footer-foreground shadow-xl flex items-center justify-center text-footer">
                  <HeartPulse className="w-7 h-7" />
                </div>
                <span className="font-black text-2xl tracking-tight leading-none">Celluid</span>
              </div>
              <p className="text-footer-foreground/80 text-base leading-relaxed max-w-md font-medium">
                Nous croyons que chaque patient mérite de comprendre son bilan de santé. Celluid utilise
                l'intelligence artificielle pour traduire la complexité biologique en clarté humaine.
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <h4 className="font-bold text-sm tracking-widest uppercase text-accent">Navigation</h4>
              <ul className="space-y-4 text-footer-foreground/60 font-medium">
                <li>
                  <a href="#" className="hover:text-footer-foreground transition-colors">
                    Accueil
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-footer-foreground transition-colors">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-footer-foreground transition-colors">
                    Protection Vie Privée
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-footer-foreground transition-colors">
                    Médecins Partenaires
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-5 space-y-6">
              <h4 className="font-bold text-sm tracking-widest uppercase text-accent">Engagement Médical</h4>
              <div className="bg-footer-foreground/10 rounded-2xl p-6 border border-footer-foreground/20">
                <p className="text-footer-foreground/70 text-sm leading-relaxed">
                  Celluid est un outil d'accompagnement. Les explications fournies ne constituent pas un
                  diagnostic médical. Consultez toujours votre médecin pour l'interprétation finale de vos résultats
                  biologiques.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="h-10 px-4 sm:px-5 rounded-full border-2 border-footer-foreground/30 bg-footer-foreground/5 flex items-center justify-center text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                  RGPD Compliant
                </div>
                <div className="h-10 px-4 sm:px-5 rounded-full border-2 border-footer-foreground/30 bg-footer-foreground/5 flex items-center justify-center text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                  AI-Powered
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 sm:pt-12 flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6 text-[10px] font-bold tracking-widest uppercase text-footer-foreground/40 text-center">
            <span>© 2026 CELLUID. DÉVELOPPÉ POUR VOTRE BIEN-ÊTRE.</span>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:gap-8">
              <a href="#" className="hover:text-footer-foreground transition-colors">
                Mentions Légales
              </a>
              <a href="#" className="hover:text-footer-foreground transition-colors">
                Confidentialité
              </a>
              <a href="#" className="hover:text-footer-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}