"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResetButton } from "./reset-button";
import { DisplayAtomspaceButton } from "./display-atomspace-button";
import { Button } from "@/components/ui/button";

let chessWindow: Window | null = null;

export function SiteHeader() {
  const pathname = usePathname();
  // Show header actions on all sections/pages
  const showResetButton = true;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [atomspaceEmpty, setAtomspaceEmpty] = useState<boolean>(() => {
    const val = (globalThis as any).Atomspace_state ?? ""
    const trimmed = (val || "").trim()
    return !trimmed || trimmed === "[]" || trimmed === "()"
  });

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      const trimmed = (detail || "").trim()
      setAtomspaceEmpty(!trimmed || trimmed === "[]" || trimmed === "()")
    }
    window.addEventListener("atomspace_state_updated", handler as EventListener)
    return () => window.removeEventListener("atomspace_state_updated", handler as EventListener)
  }, [])

  const handlePlayChess = () => {
    if (typeof window === "undefined") return
    const existing =
      chessWindow && !chessWindow.closed ? chessWindow : window.open("", "metta-chess-tab")
    if (existing) {
      chessWindow = existing
      try {
        if (existing.location.pathname !== "/chess") {
          existing.location.href = "/chess"
        } else {
          existing.focus()
        }
        return
      } catch {
        // if cross-window access fails, fall through to open a fresh tab
      }
    }
    const newWindow = window.open("/chess", "metta-chess-tab")
    if (newWindow) {
      chessWindow = newWindow
      try {
        newWindow.focus()
      } catch {
        // ignore focus errors
      }
    }
  }

  if (pathname?.startsWith("/chess")) {
    return null
  }

  return (
    <header className="fixed top-0 z-40 w-full border-b bg-background pr-5">
      <div className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-6">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="hidden md:inline h-6 w-6" />
            <span className="md:hidden font-bold">MeTTa Chess Tutorial</span>
            <span className="hidden md:inline-block font-bold">MeTTa Chess Tutorial</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center space-x-4 sm:justify-end">
          <div className="flex-1 max-w-3xl mx-auto sm:mx-1">
            <SearchBar />
          </div>
          {/* Desktop actions */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="outline" size="sm" className="text-xs px-3 h-9 min-w-[140px]" onClick={handlePlayChess}>
              Play Chess
            </Button>
            <div className="min-w-[140px] h-9">
              <ResetButton />
            </div>
            <div className="min-w-[140px] h-9">
              <DisplayAtomspaceButton />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 h-9 min-w-[140px]"
              disabled={atomspaceEmpty}
              onClick={() => {
                ;(globalThis as any).Atomspace_state = ""
                try {
                  window.localStorage.setItem("Atomspace_state", "")
                } catch {
                  // ignore storage errors
                }
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: "" }))
                }
                setAtomspaceEmpty(true)
              }}
            >
              Reset Atomspace
            </Button>
          </div>
          {/* Mobile menu */}
          <div className="md:hidden flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 p-0"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            {mobileMenuOpen && (
              <div className="absolute right-4 top-16 z-50 w-64 rounded-md border bg-background p-3 shadow-lg space-y-2">
                <Button variant="outline" size="sm" className="text-xs w-full h-9" onClick={handlePlayChess}>
                  Play Chess
                </Button>
                {showResetButton && (
                  <div className="w-full">
                    <ResetButton />
                  </div>
                )}
                <div className="w-full">
                  <DisplayAtomspaceButton />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs w-full h-9"
                  disabled={atomspaceEmpty}
                  onClick={() => {
                    ;(globalThis as any).Atomspace_state = ""
                    try {
                      window.localStorage.setItem("Atomspace_state", "")
                    } catch {
                      // ignore storage errors
                    }
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: "" }))
                    }
                    setAtomspaceEmpty(true)
                  }}
                >
                  Reset Atomspace
                </Button>
              </div>
            )}
          </div>
          <div className="mx-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header> 
  );
}
