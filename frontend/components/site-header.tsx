"use client"

import { useState } from "react"
import { HeartPulse, Menu, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetClose } from "@/components/ui/sheet"
import { ThemeToggle } from "@/components/theme-toggle"

const NAV_LINKS = [
  { href: "/prompt", label: "Éditer le prompt" },
  { href: "#", label: "Protection des données" },
  { href: "#", label: "Notre mission" },
]

function Logo({ large = false }: { large?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 shrink-0 ${large ? "w-10 h-10" : "w-9 h-9 sm:w-10 sm:h-10"}`}
      >
        <HeartPulse className={large ? "w-6 h-6" : "w-5 h-5 sm:w-6 sm:h-6"} />
      </div>
      <span className="font-black text-lg sm:text-xl tracking-tight leading-none">Celluid</span>
    </div>
  )
}

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="border-b border-border/40 bg-background/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <Logo />

        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className={
                  link.href === "/prompt"
                    ? "rounded-xl bg-foreground text-background px-6 py-2 font-semibold hover:bg-foreground/90 transition-colors"
                    : "hover:text-primary transition-colors"
                }
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="h-4 w-px bg-border/60 mx-2" />
          <ThemeToggle />
          <Button variant="ghost" size="sm" className="rounded-xl gap-2 font-semibold">
            <UserCircle className="w-4 h-4" />
            Mon Espace
          </Button>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Ouvrir le menu"
              onClick={() => setOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <SheetContent side="right" className="w-[85vw] sm:w-80 flex flex-col">
              <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
              <div className="px-4 pt-6">
                <Logo large />
              </div>
              <div className="flex flex-col gap-1 px-4 mt-8">
                {NAV_LINKS.map((link) => (
                  <SheetClose asChild key={link.label}>
                    <a
                      href={link.href}
                      className="rounded-xl px-4 py-3.5 text-base font-semibold text-foreground hover:bg-muted transition-colors"
                    >
                      {link.label}
                    </a>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-auto px-4 pb-6">
                <Button variant="outline" className="w-full rounded-xl gap-2 font-semibold justify-center h-12">
                  <UserCircle className="w-4 h-4" />
                  Mon Espace
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}
