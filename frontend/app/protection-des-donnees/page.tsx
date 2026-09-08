import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AlertTriangle } from "lucide-react"

export const metadata: Metadata = {
  title: "Protection des données | Celluid",
  description: "Politique de confidentialité et protection des données personnelles conforme au RGPD.",
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 px-1.5 py-0.5 rounded font-mono text-[0.85em]">
      {children}
    </span>
  )
}

export default function DataProtectionPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-balance mb-4">
            Politique de confidentialité
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">Dernière mise à jour : 8 septembre 2026</p>
        </div>

        <div className="rounded-2xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-950/30 p-5 sm:p-6 mb-12 flex gap-4">
          <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
            <p className="font-bold mb-1">À compléter avant mise en production</p>
            <p>
              Ce document reprend la structure exigée par le RGPD (identité du responsable de traitement, base
              légale, sous-traitants, durées de conservation, droits des personnes). Les champs surlignés en{" "}
              <Placeholder>orange</Placeholder> doivent être complétés avec les informations réelles de
              l'entreprise avant publication. Le traitement de données de santé (catégorie particulière au sens de
              l'article 9 du RGPD) justifie en outre une relecture par un juriste ou un DPO avant mise en ligne.
            </p>
          </div>
        </div>

        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-accent">
          <h2>1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement des données à caractère personnel collectées sur ce site est :{" "}
            <Placeholder>[Raison sociale de l'entreprise]</Placeholder>, <Placeholder>[forme juridique]</Placeholder>{" "}
            au capital de <Placeholder>[montant]</Placeholder>, immatriculée au RCS de{" "}
            <Placeholder>[ville]</Placeholder> sous le numéro <Placeholder>[SIREN/SIRET]</Placeholder>, dont le
            siège social est situé <Placeholder>[adresse complète]</Placeholder>.
          </p>
          <p>
            Contact en matière de protection des données :{" "}
            <Placeholder>[email dédié, ex. dpo@celluid.com]</Placeholder>.
          </p>

          <h2>2. Données collectées</h2>
          <p>Dans le cadre de l'utilisation du service d'analyse de résultats biologiques, Celluid traite :</p>
          <ul>
            <li>
              <strong>Le contenu du compte-rendu PDF que vous déposez</strong>, qui constitue une donnée de santé au
              sens de l'article 4.15 du RGPD (résultats d'analyses biologiques, valeurs, unités, intervalles de
              référence).
            </li>
            <li>
              <strong>Des données techniques standard</strong> collectées automatiquement par tout site web :
              adresse IP, type de navigateur, pages consultées, horodatage — via notre outil de mesure d'audience
              (voir section 7, « Cookies et mesure d'audience »).
            </li>
          </ul>
          <p>
            Le site ne comporte à ce jour aucun système de compte utilisateur : aucune donnée d'identité (nom,
            email, mot de passe) n'est demandée ni collectée pour utiliser l'analyseur.
          </p>

          <h2>3. Finalités du traitement</h2>
          <p>Vos données sont traitées dans les finalités suivantes, et uniquement celles-ci :</p>
          <ul>
            <li>Extraire le texte de votre compte-rendu PDF ;</li>
            <li>
              Générer, au moyen d'un modèle d'intelligence artificielle, une explication pédagogique des termes
              figurant sur votre bilan ;
            </li>
            <li>Produire, si vous le demandez, une version annotée téléchargeable du document.</li>
          </ul>
          <p>
            <strong>
              Cette explication est strictement pédagogique et ne constitue en aucun cas un diagnostic ou un avis
              médical.
            </strong>{" "}
            Elle ne doit jamais se substituer à la consultation d'un professionnel de santé.
          </p>

          <h2>4. Base légale du traitement</h2>
          <p>
            S'agissant d'une donnée de santé (catégorie particulière de données, article 9 du RGPD), le traitement
            repose sur votre <strong>consentement explicite</strong> (article 9.2.a du RGPD), recueilli avant chaque
            analyse. Vous pouvez retirer ce consentement à tout moment, sans effet rétroactif sur les traitements
            déjà réalisés ; le retrait de votre consentement empêche simplement toute nouvelle analyse.
          </p>

          <h2>5. Durée de conservation</h2>
          <p>
            Le compte-rendu que vous déposez et le texte qui en est extrait <strong>ne sont pas stockés</strong> par
            nos serveurs au-delà du temps nécessaire au traitement de votre demande : ils sont traités en mémoire et
            ne sont écrits sur aucune base de données ni aucun disque de notre infrastructure. Une fois la réponse
            renvoyée à votre navigateur, aucune copie n'est conservée de notre côté.
          </p>
          <p>
            Notre sous-traitant d'intelligence artificielle (voir section 6) peut, de son côté, conserver
            temporairement les données transmises via son API à des fins de lutte contre les abus et de sécurité,
            pour une durée limitée, sans les utiliser pour entraîner ses modèles — conformément à sa politique de
            confidentialité et aux clauses contractuelles en vigueur avec Celluid. Nous vous invitons à consulter la{" "}
            <Placeholder>[lien vers la politique de confidentialité API d'OpenAI en vigueur]</Placeholder>.
          </p>
          <p>
            Les données techniques de mesure d'audience sont conservées selon la politique de notre prestataire
            (voir section 7).
          </p>

          <h2>6. Destinataires et sous-traitants</h2>
          <p>Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires. Elles sont transmises aux seuls destinataires suivants :</p>
          <ul>
            <li>
              <strong>OpenAI, L.L.C.</strong> (États-Unis) — sous-traitant technique chargé de la génération de
              l'explication pédagogique. Cette transmission implique un transfert de données hors de l'Union
              européenne ; il est encadré par les Clauses Contractuelles Types de la Commission européenne et/ou le
              cadre de protection des données UE-États-Unis (Data Privacy Framework), selon les termes en vigueur au
              moment du traitement.
            </li>
            <li>
              <strong>
                <Placeholder>[Hébergeur du site et de l'API — nom, pays d'hébergement]</Placeholder>
              </strong>{" "}
              — hébergement technique de l'application.
            </li>
          </ul>

          <h2>7. Cookies et mesure d'audience</h2>
          <p>
            Ce site utilise Vercel Analytics, un outil de mesure d'audience conçu pour fonctionner{" "}
            <strong>sans dépôt de cookie</strong> et sans traçage individuel : les statistiques de visite sont
            agrégées et anonymisées. Aucun bandeau de consentement aux cookies n'est donc requis pour cet outil.
          </p>
          <p>
            Votre préférence d'affichage (thème clair/sombre) est mémorisée localement dans votre navigateur
            (<code>localStorage</code>), et n'est jamais transmise à nos serveurs.
          </p>
          <p>
            Si d'autres outils de mesure ou de traçage venaient à être ajoutés au site, cette politique serait mise
            à jour et un recueil de consentement conforme serait mis en place au moment de leur introduction.
          </p>

          <h2>8. Sécurité</h2>
          <p>
            Les échanges entre votre navigateur et nos serveurs sont chiffrés (HTTPS/TLS). L'accès aux
            infrastructures serveur est restreint et journalisé.{" "}
            <Placeholder>
              [Détailler ici les mesures de sécurité spécifiques réellement mises en œuvre : chiffrement au repos,
              gestion des accès, audits, etc.]
            </Placeholder>
          </p>

          <h2>9. Vos droits</h2>
          <p>Conformément aux articles 15 à 22 du RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
          <ul>
            <li>Droit d'accès à vos données ;</li>
            <li>Droit de rectification ;</li>
            <li>Droit à l'effacement (« droit à l'oubli ») ;</li>
            <li>Droit à la limitation du traitement ;</li>
            <li>Droit à la portabilité de vos données ;</li>
            <li>Droit d'opposition ;</li>
            <li>Droit de retirer votre consentement à tout moment.</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à l'adresse{" "}
            <Placeholder>[email dédié]</Placeholder>. Vous disposez également du droit d'introduire une réclamation
            auprès de la{" "}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">
              Commission Nationale de l'Informatique et des Libertés (CNIL)
            </a>{" "}
            — 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07 — si vous estimez que vos droits ne sont pas
            respectés.
          </p>

          <h2>10. Mineurs</h2>
          <p>
            Ce service n'est pas destiné aux personnes mineures utilisées sans l'accompagnement d'un responsable
            légal. Nous ne collectons pas sciemment de données concernant des mineurs.
          </p>

          <h2>11. Modification de cette politique</h2>
          <p>
            Cette politique peut être mise à jour pour refléter des évolutions légales, techniques ou
            organisationnelles. La date de dernière mise à jour figure en haut de cette page.
          </p>

          <h2>12. Contact</h2>
          <p>
            Pour toute question relative à cette politique ou à vos données personnelles :{" "}
            <Placeholder>[email de contact]</Placeholder>.
          </p>
        </div>
      </article>

      <SiteFooter />
    </main>
  )
}
