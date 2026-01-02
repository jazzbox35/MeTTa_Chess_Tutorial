"use client"

import { useEffect } from "react"

/**
 * Keeps Atomspace_state in sync across tabs/windows by listening for
 * custom events and storage updates, and applying the value to globalThis.
 */
export function AtomspaceListener() {
  useEffect(() => {
    const applyAtomspace = (value: string) => {
      ;(globalThis as any).Atomspace_state = value
    }

    // Initialize from localStorage if present
    try {
      const stored = window.localStorage.getItem("Atomspace_state")
      if (stored !== null) {
        applyAtomspace(stored)
      }
    } catch {
      // ignore storage errors
    }

    const atomspaceHandler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      applyAtomspace(detail)
      try {
        window.localStorage.setItem("Atomspace_state", detail)
      } catch {
        // ignore storage errors
      }
    }

    const storageHandler = (event: StorageEvent) => {
      if (event.key === "Atomspace_state") {
        applyAtomspace(event.newValue ?? "")
      }
    }

    window.addEventListener("atomspace_state_updated", atomspaceHandler as EventListener)
    window.addEventListener("storage", storageHandler)

    return () => {
      window.removeEventListener("atomspace_state_updated", atomspaceHandler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  return null
}
