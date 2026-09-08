"use client"

import type React from "react"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef } from "react"
import { analyzeLabPdf } from "@/app/actions/analyzer-actions"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FileText,
  Loader2,
  ArrowRight,
  Upload,
  Download,
  CheckCircle2,
  ShieldCheck,
  ClipboardList as ClipboardText,
  Plus,
  Trash2,
  Sparkles,
  AlertCircle,
} from "lucide-react"

interface LabEntry {
  id: string
  name: string
  value: string
  lowerLimit: string
  upperLimit: string
}

export function AnalyzerForm() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pdf")
  const [manualEntries, setManualEntries] = useState<LabEntry[]>([
    { id: "entry-0", name: "", value: "", lowerLimit: "", upperLimit: "" },
  ])
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<{ analysis: string; fileBase64?: string; fileName?: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const entryCounterRef = useRef(1)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setResult(null)
  }

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
    setIsAnalyzing(true)
    setResult(null)

    try {
      const formData = new FormData()

      if (file) {
        // Send File directly to API - NO browser extraction!
        formData.append("pdfFile", file)
        formData.append("fileName", file.name)
      } else {
        // Manual entry
        const formattedText = manualEntries
          .filter((e) => e.name.trim())
          .map((e) => `${e.name}: ${e.value} (Réf: ${e.lowerLimit} - ${e.upperLimit})`)
          .join("\n")

        if (!formattedText.trim()) {
          toast({
            title: "Données manquantes",
            description: "Veuillez entrer des données ou télécharger un PDF.",
            variant: "destructive",
          })
          setIsAnalyzing(false)
          return
        }
        formData.append("text", formattedText)
      }

      const response = await analyzeLabPdf(formData)

      if (response.success) {
        setResult({
          analysis: response.analysis!,
          fileBase64: response.fileBase64,
          fileName: response.fileName,
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
    }
  }

  const downloadModifiedPdf = () => {
    if (!result?.fileBase64) return

    const link = document.createElement("a")
    link.href = `data:application/pdf;base64,${result.fileBase64}`
    link.download = result.fileName || "analyse_avencio.pdf"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Téléchargement lancé",
      description: "Votre PDF annoté est en cours de téléchargement.",
    })
  }

  const addEntry = () => {
    const newId = `entry-${entryCounterRef.current}`
    entryCounterRef.current += 1
    setManualEntries([...manualEntries, { id: newId, name: "", value: "", lowerLimit: "", upperLimit: "" }])
  }

  const removeEntry = (id: string) => {
    if (manualEntries.length > 1) {
      setManualEntries(manualEntries.filter((e) => e.id !== id))
    }
  }

  const updateEntry = (id: string, field: keyof LabEntry, value: string) => {
    setManualEntries(manualEntries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-20">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[450px] mx-auto mb-10 bg-muted/50 p-1.5 rounded-full border border-border/40 shadow-lg shadow-primary/5">
          <TabsTrigger
            value="pdf"
            className="rounded-full py-3 font-bold text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
          >
            <Upload className="w-4 h-4 mr-2" />
            Télécharger un PDF
          </TabsTrigger>
          <TabsTrigger
            value="text"
            className="rounded-full py-3 font-bold text-sm transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-lg"
          >
            <ClipboardText className="w-4 h-4 mr-2" />
            Saisie Manuelle
          </TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-2xl shadow-primary/10 rounded-[2.5rem] overflow-hidden bg-card/60 backdrop-blur-xl border border-border/50">
          <CardContent className="p-8 md:p-12">
            <TabsContent value="pdf" className="mt-0 space-y-6">
              <div
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center border-2 border-dashed rounded-[2rem] p-16 transition-all cursor-pointer
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
                  <div className="text-center space-y-5 animate-in fade-in zoom-in duration-300">
                    <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-6 rounded-3xl w-fit mx-auto border border-primary/30 shadow-lg">
                      <FileText className="w-14 h-14 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-xl text-foreground">{file.name}</p>
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
                        className="text-destructive hover:bg-destructive/10 rounded-full font-semibold"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer le fichier
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center space-y-5">
                    <div className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-full w-fit mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Upload className="w-14 h-14 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-2xl text-foreground">Déposez votre bilan médical PDF ici</p>
                      <p className="text-muted-foreground text-base">ou cliquez pour parcourir vos fichiers</p>
                      <p className="text-xs text-muted-foreground/70">Format accepté: PDF • Taille max: 50 MB</p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-0 space-y-8">
              <div className="space-y-6">
                <div className="grid grid-cols-[1fr_120px_120px_120px_50px] gap-4 px-4 text-[10px] font-black tracking-widest text-muted-foreground/60 uppercase">
                  <span>Nom de l&apos;analyse</span>
                  <span className="text-center">Valeur mesurée</span>
                  <span className="text-center">Limite inf.</span>
                  <span className="text-center">Limite sup.</span>
                  <span></span>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {manualEntries.map((entry, index) => (
                    <div
                      key={entry.id}
                      className="grid grid-cols-[1fr_120px_120px_120px_50px] gap-4 items-center group animate-in fade-in slide-in-from-top-2 duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <input
                        type="text"
                        placeholder="ex: Hémoglobine"
                        value={entry.name}
                        onChange={(e) => updateEntry(entry.id, "name", e.target.value)}
                        className="w-full bg-background/50 border-2 border-border/40 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all placeholder:text-muted-foreground/30 font-semibold"
                        disabled={isAnalyzing}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="11.8"
                        value={entry.value}
                        onChange={(e) => updateEntry(entry.id, "value", e.target.value)}
                        className="w-full bg-background/50 border-2 border-border/40 rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-center font-black text-primary text-lg"
                        disabled={isAnalyzing}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="12.0"
                        value={entry.lowerLimit}
                        onChange={(e) => updateEntry(entry.id, "lowerLimit", e.target.value)}
                        className="w-full bg-background/50 border-2 border-border/40 rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-center font-bold text-muted-foreground/70"
                        disabled={isAnalyzing}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="16.0"
                        value={entry.upperLimit}
                        onChange={(e) => updateEntry(entry.id, "upperLimit", e.target.value)}
                        className="w-full bg-background/50 border-2 border-border/40 rounded-2xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-center font-bold text-muted-foreground/70"
                        disabled={isAnalyzing}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEntry(entry.id)}
                        disabled={manualEntries.length === 1 || isAnalyzing}
                        className="h-12 w-12 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-2xl transition-all border border-transparent hover:border-destructive/20 disabled:opacity-30"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={addEntry}
                  disabled={isAnalyzing}
                  className="w-full rounded-2xl border-dashed border-2 py-7 hover:bg-primary/5 hover:border-primary/40 text-muted-foreground hover:text-primary font-bold transition-all group bg-transparent disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                  Ajouter une ligne d&apos;analyse
                </Button>
              </div>
            </TabsContent>

            <div className="mt-10 pt-8 border-t space-y-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground justify-center">
                <ShieldCheck className="w-5 h-5 text-accent" />
                <p className="font-medium">Données chiffrées de bout en bout • Aucun stockage permanent</p>
              </div>

              <Button
                onClick={handleAnalyze}
                disabled={(!file && manualEntries.every((e) => !e.name.trim())) || isAnalyzing}
                className="w-full rounded-full px-12 py-7 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isAnalyzing && <Loader2 className="h-5 w-5 animate-spin" />}
                {!isAnalyzing && <Sparkles className="h-5 w-5" />}
                <span>{isAnalyzing ? "Analyse en cours avec l'IA..." : "Analyser mes résultats"}</span>
                {!isAnalyzing && <ArrowRight className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>

      {result && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-primary to-accent p-4 rounded-2xl shadow-lg">
                <CheckCircle2 className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight">Analyse terminée</h2>
                <p className="text-muted-foreground text-sm mt-1">Votre bilan a été analysé avec succès</p>
              </div>
            </div>
            {result.fileBase64 && (
              <Button
                onClick={downloadModifiedPdf}
                className="rounded-full gap-2 px-6 py-6 shadow-lg hover:shadow-xl transition-all group"
              >
                <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                Télécharger le PDF annoté
              </Button>
            )}
          </div>

          <div className="grid gap-8">
            <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-primary/5 via-accent/5 to-background p-10 shadow-xl">
              <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-foreground/90">
                <div className="flex items-start gap-5 mb-8 pb-6 border-b border-border/50">
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <Sparkles className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black m-0 mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                      Interprétation Avencio
                    </h3>
                    <p className="text-muted-foreground mt-0 text-base font-medium">
                      Voici une synthèse pédagogique de vos résultats biologiques.
                    </p>
                  </div>
                </div>

                <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/90 font-medium">
                  {result.analysis}
                </div>
              </div>
            </Card>

            <Alert className="rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/50 p-10 shadow-lg">
            <AlertCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-lg ml-4 space-y-3">
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
    </div>
  )
}