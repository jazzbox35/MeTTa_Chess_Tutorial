"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { splitParenthesizedArray } from "@/lib/split-parenthesized-array"

export function DisplayAtomspaceButton() {
  const [atomspaceState, setAtomspaceState] = useState<string | null>(null)

  useEffect(() => {
    // Initialize from global or localStorage
    let initial: string | null = (globalThis as any).Atomspace_state ?? null
    try {
      if (!initial) {
        initial = window.localStorage.getItem("Atomspace_state")
      }
    } catch {
      // ignore storage errors
    }
    setAtomspaceState(initial)
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      setAtomspaceState(detail || null)
    }
    window.addEventListener("atomspace_state_updated", handler as EventListener)
    // Also listen to storage events in case another tab updates it
    const storageHandler = () => {
      try {
        const val = window.localStorage.getItem("Atomspace_state")
        setAtomspaceState(val)
      } catch {
        // ignore storage errors
      }
    }
    window.addEventListener("storage", storageHandler)

    return () => {
      window.removeEventListener("atomspace_state_updated", handler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  const handleClick = () => {
    const raw = atomspaceState ?? ""
    const processed = raw ? splitParenthesizedArray(raw) : ""
    const msg = processed || raw || "Atomspace empty."
    const win = window.open("", "_blank")
    if (win) {
      win.document.write(`
        <html>
          <head>
            <title>Atomspace State</title>
            <style>
              body { font-family: sans-serif; padding: 16px; }
              pre { white-space: pre-wrap; word-break: break-word; }
            </style>
          </head>
          <body>
            <h3>Atomspace State</h3>
            <pre>${msg}</pre>
          </body>
        </html>
      `)
      win.document.close()
    } else {
      alert(msg)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs px-3 h-9 w-full"
      onClick={handleClick}
    >
      Display Atomspace
    </Button>
  )
}
