"use client"

import type React from "react"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef } from "react"
import { analyzeLabPdf } from "@/app/actions/analyzer-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { AnalysisProgress } from "@/components/analysis-progress"
import { AnalysisReport, type ClassificationItem } from "@/lib/render-analysis"
import {
  FileText,
  Loader2,
  ArrowRight,
  Upload,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Trash2,
  Sparkles,
  AlertCircle,
} from "lucide-react"

export function AnalyzerForm() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    analysis: string
    fileBase64?: string
    fileName?: string
    classification?: ClassificationItem[]
  } | null>(null)
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false)
  const [consentGiven, setConsentGiven] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      if (selectedFile.type !== "application/pdf") {
        toast({
          title: "Type de fichier incorrect",
          description: "Veuillez sélectionner un fichier PDF valide.",
          variant: "destructive",
        })
        return
      }
      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "Aucun fichier",
        description: "Veuillez déposer un PDF avant de lancer l'analyse.",
        variant: "destructive",
      })
      return
    }

    if (!consentGiven) {
      toast({
        title: "Consentement requis",
        description: "Veuillez cocher la case de consentement avant d'analyser vos données de santé.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append("pdfFile", file)
      formData.append("fileName", file.name)

      const response = await analyzeLabPdf(formData)

      if (response.success) {
        setFinishing(true)
        await new Promise((resolve) => setTimeout(resolve, 500)) // let the progress bar visibly reach 100%
        setResult({
          analysis: response.analysis!,
          fileBase64: response.fileBase64,
          fileName: response.fileName,
          classification: response.classification,
        })
        toast({
          title: "Analyse terminée",
          description: "Votre bilan a été analysé avec succès.",
        })
      } else {
        toast({
          title: "Erreur d'analyse",
          description: response.error || "Une erreur est survenue lors de l'analyse.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur de connexion au service d'analyse.",
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
      setFinishing(false)
    }
  }

  const downloadModifiedPdf = () => {
    if (!result?.fileBase64) return

    const link = document.createElement("a")
    link.href = `data:application/pdf;base64,${result.fileBase64}`
    link.download = result.fileName || "analyse_celluid.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Téléchargement lancé",
      description: "Votre PDF annoté est en cours de téléchargement.",
    })
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-12 pb-12 sm:pb-20">
      <Card className="border-none shadow-2xl shadow-primary/10 rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50">
        <CardContent className="p-4 sm:p-8 md:p-12">
          <div
            onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 transition-all cursor-pointer
              ${isAnalyzing ? "opacity-50 cursor-not-allowed" : ""}
              ${file ? "border-accent/50 bg-accent/5" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5"}
            `}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />

            {file ? (
              <div className="text-center space-y-4 sm:space-y-5 animate-in fade-in zoom-in duration-300 w-full">
                <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-4 sm:p-6 rounded-2xl sm:rounded-3xl w-fit mx-auto border border-primary/30 shadow-lg">
                  <FileText className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
                </div>
                <div className="px-2">
                  <p className="font-bold text-base sm:text-xl text-foreground break-all">{file.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Prêt pour l&apos;analyse
                  </p>
                </div>
                {!isAnalyzing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFile(null)
                    }}
                    className="text-destructive hover:bg-destructive/10 rounded-xl font-semibold"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Supprimer le fichier
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center space-y-3 sm:space-y-5">
                <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-4 sm:p-6 rounded-full w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-10 h-10 sm:w-14 sm:h-14 text-primary" />
                </div>
                <div className="space-y-1.5 sm:space-y-2 px-2">
                  <p className="font-bold text-lg sm:text-2xl text-foreground text-balance">
                    Déposez votre bilan médical PDF ici
                  </p>
                  <p className="text-muted-foreground text-sm sm:text-base">ou cliquez pour parcourir vos fichiers</p>
                  <p className="text-xs text-muted-foreground/70">Format accepté: PDF • Taille max: 50 MB</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 sm:mt-10 pt-6 sm:pt-8 border-t space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground justify-center text-center px-2">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-accent shrink-0" />
              <p className="font-medium">Données chiffrées de bout en bout • Aucun stockage permanent</p>
            </div>

            <label className="flex items-start gap-3 px-2 sm:px-4 cursor-pointer group">
              <Checkbox
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked === true)}
                disabled={isAnalyzing}
                className="mt-0.5 shrink-0"
              />
              <span className="text-xs sm:text-sm text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors">
                J'ai lu la{" "}
                <a
                  href="/protection-des-donnees"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-accent underline underline-offset-2 hover:text-accent/80"
                >
                  politique de confidentialité
                </a>{" "}
                et je consens à ce que le contenu de mon compte-rendu (donnée de santé) soit transmis à notre
                prestataire d'intelligence artificielle dans le seul but de générer l'explication pédagogique.
              </span>
            </label>

            <Button
              onClick={handleAnalyze}
              disabled={!file || !consentGiven || isAnalyzing}
              className="w-full rounded-xl px-6 sm:px-12 py-5 sm:py-7 text-base sm:text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
            >
              {isAnalyzing && <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin shrink-0" />}
              {!isAnalyzing && <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
              <span>{isAnalyzing ? "Analyse en cours..." : "Analyser mes résultats"}</span>
              {!isAnalyzing && <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />}
            </Button>

            <AnalysisProgress active={isAnalyzing} complete={finishing} />
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-primary to-accent p-3 sm:p-4 rounded-2xl shadow-lg shrink-0">
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">Analyse terminée</h2>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">Votre bilan a été analysé avec succès</p>
              </div>
            </div>
            {result.fileBase64 && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setPdfPreviewOpen(true)}
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl gap-2 px-5 py-5 sm:py-6 border-accent/40 text-accent hover:bg-accent/10 hover:text-accent"
                >
                  <Eye className="w-4 h-4 shrink-0" />
                  Voir le PDF
                </Button>
                <Button
                  onClick={downloadModifiedPdf}
                  className="w-full sm:w-auto rounded-xl gap-2 px-6 py-5 sm:py-6 shadow-lg hover:shadow-xl transition-all group"
                >
                  <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform shrink-0" />
                  Télécharger le PDF annoté
                </Button>
              </div>
            )}
          </div>

          {result.classification && result.classification.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="rounded-xl sm:rounded-2xl border border-border/50 bg-card/60 p-3 sm:p-5 text-center">
                <p className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
                  {result.classification.length}
                </p>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-muted-foreground mt-0.5">
                  Analyses
                </p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-3 sm:p-5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-red-600 dark:text-red-400" />
                  <p className="text-2xl sm:text-4xl font-black tracking-tight text-red-700 dark:text-red-300">
                    {result.classification.filter((r) => r.status === "ABOVE" || r.status === "BELOW").length}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-red-700/70 dark:text-red-300/70 mt-0.5">
                  Hors repères
                </p>
              </div>
              <div className="rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/60 dark:bg-emerald-950/20 p-3 sm:p-5 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-2xl sm:text-4xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">
                    {result.classification.filter((r) => r.status === "NORMAL").length}
                  </p>
                </div>
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-emerald-700/70 dark:text-emerald-300/70 mt-0.5">
                  Dans les repères
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:gap-8">
            <Card className="rounded-[2rem] sm:rounded-[2.5rem] border-none bg-gradient-to-br from-primary/5 via-accent/5 to-background p-5 sm:p-8 md:p-10 shadow-xl">
              <div className="max-w-none">
                <div className="flex items-start gap-3 sm:gap-5 mb-5 sm:mb-8 pb-4 sm:pb-6 border-b border-border/50">
                  <div className="bg-primary/10 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl shrink-0">
                    <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black m-0 mb-1 sm:mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Interprétation Celluid
                    </h3>
                    <p className="text-muted-foreground mt-0 text-sm sm:text-base font-medium">
                      Voici une synthèse pédagogique de vos résultats biologiques.
                    </p>
                  </div>
                </div>

                <AnalysisReport analysis={result.analysis} classification={result.classification} />
              </div>
            </Card>

            <Alert className="rounded-2xl sm:rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/50 p-5 sm:p-8 md:p-10 shadow-lg">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm sm:text-lg ml-3 sm:ml-4 space-y-2 sm:space-y-3">
              <p className="font-bold text-amber-900 dark:text-amber-200">
                Important – Information médicale
              </p>
              <p className="text-amber-800 dark:text-amber-100 leading-relaxed">
                Cette synthèse est fournie à titre éducatif uniquement. Elle ne constitue pas un diagnostic médical et ne remplace en aucun cas l'avis de votre médecin traitant, seul habilité à interpréter vos résultats dans le contexte complet de votre santé.
              </p>
            </AlertDescription>
          </Alert>
          </div>
        </div>
      )}

      {result?.fileBase64 && (
        <Dialog open={pdfPreviewOpen} onOpenChange={setPdfPreviewOpen}>
          <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 gap-0 rounded-2xl overflow-hidden flex flex-col">
            <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0 text-left">
              <DialogTitle className="text-base sm:text-lg">
                {result.fileName || "PDF annoté"}
              </DialogTitle>
            </DialogHeader>
            <iframe
              src={`data:application/pdf;base64,${result.fileBase64}`}
              title="Aperçu du PDF annoté"
              className="flex-1 w-full bg-muted"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
