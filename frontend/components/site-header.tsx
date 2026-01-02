"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { DisplayAtomspaceButton } from "./display-atomspace-button";
import { Button } from "@/components/ui/button";

let chessWindow: Window | null = null;
const INITIAL_BOARD_STATE =
  "(board-state ((1 8 g r) (2 8 g n) (3 8 g b) (4 8 g q) (5 8 g k) (6 8 g b) (7 8 g n) (8 8 g r) (1 7 g p) (2 7 g p) (3 7 g p) (4 7 g p) (5 7 g p) (6 7 g p) (7 7 g p) (8 7 g p) (1 6) (2 6) (3 6) (4 6) (5 6) (6 6) (7 6) (8 6) (1 5) (2 5) (3 5) (4 5) (5 5) (6 5) (7 5) (8 5) (1 4) (2 4) (3 4) (4 4) (5 4) (6 4) (7 4) (8 4) (1 3) (2 3) (3 3) (4 3) (5 3) (6 3) (7 3) (8 3) (1 2 s p) (2 2 s p) (3 2 s p) (4 2 s p) (5 2 s p) (6 2 s p) (7 2 s p) (8 2 s p) (1 1 s r) (2 1 s n) (3 1 s b) (4 1 s q) (5 1 s k) (6 1 s b) (7 1 s n) (8 1 s r)))";

export function SiteHeader() {
  const pathname = usePathname();
  // Show header actions on all sections/pages
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [atomspaceEmpty, setAtomspaceEmpty] = useState<boolean>(() => {
    const val = (globalThis as any).Atomspace_state ?? ""
    const trimmed = (val || "").trim()
    return !trimmed || trimmed === "[]" || trimmed === "()"
  });
  const runDefaultProgram = async () => {
    try {
      const res = await fetch("/api/default-program")
      if (!res.ok) {
        throw new Error(`Failed to load default program (${res.status})`)
      }
      const program = (await res.text()).trim()

      ;(globalThis as any).Atomspace_state = program
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("Atomspace_state", program)
          window.localStorage.setItem("board_state", INITIAL_BOARD_STATE)
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: program }))
        window.dispatchEvent(new CustomEvent("board_state_updated", { detail: INITIAL_BOARD_STATE }))
      }
      alert("Now running default MeTTa chess program.")
      setAtomspaceEmpty(false)
    } catch (err) {
      console.error(err)
      alert("Failed to load default program.")
    }
  }

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      const trimmed = (detail || "").trim()
      setAtomspaceEmpty(!trimmed || trimmed === "[]" || trimmed === "()")
    }
    window.addEventListener("atomspace_state_updated", handler as EventListener)
    return () => window.removeEventListener("atomspace_state_updated", handler as EventListener)
  }, [])

  const handlePlayChess = async () => {
    if (typeof window === "undefined") return
    if (atomspaceEmpty) {
      await runDefaultProgram()
    }
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
                  window.localStorage.setItem("board_state", INITIAL_BOARD_STATE)
                } catch {
                  // ignore storage errors
                }
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: "" }))
                  window.dispatchEvent(new CustomEvent("board_state_updated", { detail: INITIAL_BOARD_STATE }))
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
                      window.localStorage.setItem("board_state", INITIAL_BOARD_STATE)
                    } catch {
                      // ignore storage errors
                    }
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: "" }))
                      window.dispatchEvent(new CustomEvent("board_state_updated", { detail: INITIAL_BOARD_STATE }))
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
