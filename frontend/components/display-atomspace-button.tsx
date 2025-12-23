"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { splitParenthesizedArray } from "@/lib/split-parenthesized-array"

// Lightweight s-expression pretty printer (for display only)
function prettyPrintSexpr(input: string): string {
  let indent = 0
  const tokens: string[] = []
  let current = ""

  const flush = () => {
    if (current.trim()) tokens.push(current.trim())
    current = ""
  }

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (ch === "(" || ch === ")") {
      flush()
      tokens.push(ch)
    } else if (/\s/.test(ch)) {
      flush()
    } else {
      current += ch
    }
  }
  flush()

  const lines: string[] = []
  let line = ""
  const pushLine = () => {
    if (line.trim().length) lines.push(line.trimEnd())
    line = ""
  }

  tokens.forEach((tok, idx) => {
    if (tok === "(") {
      if (line.trim().length === 0) line = "    ".repeat(indent) + "("
      else line += " ("
      indent++
    } else if (tok === ")") {
      indent = Math.max(indent - 1, 0)
      if (line.trim().length === 0) line = "    ".repeat(indent) + ")"
      else line += " )"
      pushLine()
    } else {
      // If previous token was "(" and current is "=", keep on same line: "(="
      if (line.trim().endsWith("(") && tok === "=") {
        line += "="
      } else {
        if (line.trim().length === 0) line = "    ".repeat(indent) + tok
        else line += " " + tok
      }
      if (tokens[idx + 1] === "(" && !line.trim().endsWith("(=")) pushLine()
    }
  })
  pushLine()
  return lines.join("\n")
}

export function DisplayAtomspaceButton() {
  const [atomspaceState, setAtomspaceState] = useState<string | null>(null)
  const [atomspaceWindow, setAtomspaceWindow] = useState<Window | null>(null)

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

  // Render helper
  const renderAtomspaceWindow = (win: Window, raw: string) => {
    const trimmed = (raw || "").trim()
    // treat empty, null, undefined, or literal [] as empty
    const normalized = trimmed && trimmed !== "[]" ? trimmed : "Atomspace empty"
    let msg = normalized
    if (/[()]/.test(normalized)) {
      try {
        const split = splitParenthesizedArray(normalized)
        msg = split ? prettyPrintSexpr(split) : normalized
      } catch {
        msg = normalized
      }
    }
    const escaped = msg
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
    win.document.open()
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
          <pre>${escaped}</pre>
        </body>
      </html>
    `)
    win.document.close()
  }

  // Update the atomspace window automatically when global atomspace changes
  useEffect(() => {
    const win = atomspaceWindow
    if (win && !win.closed) {
      renderAtomspaceWindow(win, atomspaceState ?? "")
    }
  }, [atomspaceState, atomspaceWindow])

  const handleClick = () => {
    const raw = atomspaceState ?? ""
    // Always (re)open/update the same named window to bring it to front
    const win = window.open("about:blank", "atomspace_state")
    setAtomspaceWindow(win)
    if (win) {
      renderAtomspaceWindow(win, raw)
    } else {
      alert(raw || "Atomspace empty.")
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
