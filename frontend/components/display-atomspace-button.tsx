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
    const msg = processed || "No Atomspace state available."
    alert(msg)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-xs px-2 py-1"
      onClick={handleClick}
    >
      Display Atomspace
    </Button>
  )
}
