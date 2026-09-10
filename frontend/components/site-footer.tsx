import Link from "next/link"
import { HeartPulse } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="bg-gradient-to-br from-footer via-footer to-footer/95 text-footer-foreground pt-16 pb-10 sm:pt-24 sm:pb-12 rounded-t-[2rem] sm:rounded-t-[3rem] shadow-2xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 md:gap-16 pb-12 sm:pb-16 md:pb-20 border-b border-footer-foreground/10">
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-footer-foreground shadow-xl flex items-center justify-center text-footer">
                <HeartPulse className="w-7 h-7" />
              </div>
              <span className="font-black text-2xl tracking-tight leading-none">Cellude</span>
            </div>
            <p className="text-footer-foreground/80 text-base leading-relaxed max-w-md font-medium">
              Nous croyons que chaque patient mérite de comprendre son bilan de santé. Cellude utilise
              l'intelligence artificielle pour traduire la complexité biologique en clarté humaine.
            </p>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h4 className="font-bold text-sm tracking-widest uppercase text-accent">Navigation</h4>
            <ul className="space-y-4 text-footer-foreground/60 font-medium">
              <li>
                <Link href="/" className="hover:text-footer-foreground transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-footer-foreground transition-colors">
                  Comment ça marche
                </a>
              </li>
              <li>
                <Link href="/protection-des-donnees" className="hover:text-footer-foreground transition-colors">
                  Protection Vie Privée
                </Link>
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
                Cellude est un outil d'accompagnement. Les explications fournies ne constituent pas un
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
          <span>© 2026 CELLUDE. DÉVELOPPÉ POUR VOTRE BIEN-ÊTRE.</span>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 sm:gap-8">
            <Link href="/mentions-legales" className="hover:text-footer-foreground transition-colors">
              Mentions Légales
            </Link>
            <Link href="/protection-des-donnees" className="hover:text-footer-foreground transition-colors">
              Confidentialité
            </Link>
            <a href="#" className="hover:text-footer-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
