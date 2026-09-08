import { AnalyzerForm } from "@/components/analyzer-form"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import type { Metadata } from "next"

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

      <SiteFooter />
    </main>
  )
}