"use client"

import { useState } from "react"
import type React from "react"
import Link from "next/link"
import { Lock, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PromptLogin({ passwordConfigured }: { passwordConfigured: boolean }) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (data.success) {
        window.location.reload() // re-run the server component with the new cookie
      } else {
        setError(data.error || "Mot de passe incorrect.")
      }
    } catch {
      setError("Erreur de connexion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-foreground rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-background" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Accès protégé</h1>
          <p className="text-muted-foreground text-sm mt-1">Cette page nécessite un mot de passe.</p>
        </div>

        {!passwordConfigured ? (
          <div className="rounded-xl border border-amber-300/50 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
            Aucun mot de passe n'est configuré côté serveur. Définissez{" "}
            <code className="px-1 py-0.5 bg-background rounded font-mono text-xs">PROMPT_ADMIN_PASSWORD</code> dans
            le fichier <code className="px-1 py-0.5 bg-background rounded font-mono text-xs">.env</code> du
            frontend, puis redémarrez le serveur.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              autoFocus
              className="w-full bg-card border border-input rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading || !password} className="w-full rounded-xl py-6 font-bold">
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
