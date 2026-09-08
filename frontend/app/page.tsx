import { AnalyzerForm } from "@/components/analyzer-form"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import { HeartPulse, UserCircle } from "lucide-react"

export const metadata: Metadata = {
  title: "FranceHealth | Analyseur de Résultats Biologiques Intelligent",
  description:
    "Comprenez vos analyses médicales en un instant grâce à notre IA sécurisée. Téléchargez votre PDF et recevez une explication claire.",
}

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-accent/20">
      <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight leading-none uppercase">France</span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase opacity-80">Health</span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-10">
            <nav className="flex items-center gap-8 text-sm font-semibold text-muted-foreground">
              <a href="/prompt" className="hover:text-primary transition-colors bg-black text-white pr-10 pl-10 pt-2 pb-2 hover:ease-in hover:bg-blue hover:text-white">
                Go to Prompt Edid
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Protection des données
              </a>
              <a href="#" className="hover:text-primary transition-colors">
                Notre mission
              </a>
            </nav>
            <div className="h-4 w-px bg-border/60 mx-2" />
            <Button variant="ghost" size="sm" className="rounded-full gap-2 font-semibold">
              <UserCircle className="w-4 h-4" />
              Mon Espace
            </Button>
          </div>

          <div className="lg:hidden">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
              <div className="w-4 h-0.5 bg-foreground rounded-full relative after:content-[''] after:absolute after:w-4 after:h-0.5 after:bg-foreground after:rounded-full after:-top-1 before:content-[''] before:absolute before:w-4 before:h-0.5 before:bg-foreground before:rounded-full before:top-1" />
            </div>
          </div>
        </div>
      </nav>

      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-[radial-gradient(ellipse_at_center,var(--accent)_0%,transparent_60%)] opacity-[0.08] -z-10 blur-3xl" />
        <div className="absolute top-20 right-10 w-[400px] h-[400px] bg-primary/10 blur-[100px] rounded-full -z-10" />
        <div className="absolute bottom-20 left-10 w-[350px] h-[350px] bg-accent/10 blur-[100px] rounded-full -z-10" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-primary/5 backdrop-blur-md border border-primary/20 shadow-lg shadow-primary/5 text-primary text-xs font-black tracking-[0.2em] uppercase mb-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent shadow-lg shadow-accent/50"></span>
            </span>
            Technologie IA Sécurisée
          </div>

          <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.95] text-balance">
            La clarté pour <br />
            <span className="inline-block mt-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent [background-size:200%] animate-[gradient_8s_ease_infinite] italic">
              votre santé.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed text-pretty">
            Téléchargez votre compte-rendu PDF ou collez vos résultats pour une explication claire et instantanée.
          </p>

          <div className="pt-8">
            <AnalyzerForm />
          </div>
        </div>
      </section>

      <footer className="bg-gradient-to-br from-primary via-primary to-primary/95 text-primary-foreground pt-24 pb-12 rounded-t-[3rem] shadow-2xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 pb-20 border-b border-primary-foreground/10">
            <div className="md:col-span-5 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-foreground shadow-xl flex items-center justify-center text-primary">
                  <HeartPulse className="w-7 h-7" />
                </div>
                <div className="flex flex-col">
                  <span className="font-black text-2xl tracking-tight leading-none uppercase">France</span>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-accent uppercase opacity-90">
                    Health
                  </span>
                </div>
              </div>
              <p className="text-primary-foreground/80 text-base leading-relaxed max-w-md font-medium">
                Nous croyons que chaque patient mérite de comprendre son bilan de santé. FranceHealth utilise
                l'intelligence artificielle pour traduire la complexité biologique en clarté humaine.
              </p>
            </div>

            <div className="md:col-span-2 space-y-6">
              <h4 className="font-bold text-sm tracking-widest uppercase text-accent">Navigation</h4>
              <ul className="space-y-4 text-primary-foreground/60 font-medium">
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors">
                    Accueil
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors">
                    Comment ça marche
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors">
                    Protection Vie Privée
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary-foreground transition-colors">
                    Médecins Partenaires
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-5 space-y-6">
              <h4 className="font-bold text-sm tracking-widest uppercase text-accent">Engagement Médical</h4>
              <div className="bg-primary-foreground/10 rounded-2xl p-6 border border-primary-foreground/20">
                <p className="text-primary-foreground/70 text-sm leading-relaxed">
                  FranceHealth est un outil d'accompagnement. Les explications fournies ne constituent pas un
                  diagnostic médical. Consultez toujours votre médecin pour l'interprétation finale de vos résultats
                  biologiques.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <div className="h-10 px-5 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/5 flex items-center justify-center text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                  RGPD Compliant
                </div>
                <div className="h-10 px-5 rounded-full border-2 border-primary-foreground/30 bg-primary-foreground/5 flex items-center justify-center text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                  AI-Powered
                </div>
              </div>
            </div>
          </div>

          <div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold tracking-widest uppercase text-primary-foreground/40">
            <span>© 2026 FRANCEHEALTH. DÉVELOPPÉ POUR VOTRE BIEN-ÊTRE.</span>
            <div className="flex gap-8">
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Mentions Légales
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Confidentialité
              </a>
              <a href="#" className="hover:text-primary-foreground transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}