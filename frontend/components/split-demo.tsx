"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { splitParenthesizedArray } from "@/lib/split-parenthesized-array"

export function SplitDemo() {
  const [input, setInput] = useState("[ (data1), (data2) ]")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const atomspaceState = (globalThis as any).Atomspace_state ?? ""

  // Listen for Atomspace_state updates coming from /metta_stateless responses
  useEffect(() => {
    // Initialize from localStorage if available
    try {
      const stored = window.localStorage.getItem("Atomspace_state")
      if (stored) {
        setInput(stored)
        // Auto-split for display when prefilled
        setOutput(splitParenthesizedArray(stored))
      }
    } catch {
      // ignore storage errors
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      const value = detail || "[ (data1), (data2) ]"
      setInput(value)
      try {
        setOutput(splitParenthesizedArray(value))
      } catch {
        setOutput("")
      }
    }
    window.addEventListener("atomspace_state_updated", handler as EventListener)
    return () => window.removeEventListener("atomspace_state_updated", handler as EventListener)
  }, [])

  const handleSplit = () => {
    try {
      setError(null)
      setOutput(splitParenthesizedArray(input))
    } catch (err) {
      setOutput("")
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="min-h-[100px]"
      />
      {atomspaceState ? (
        <div className="text-sm text-muted-foreground">
          Atomspace_state: <code>{String(atomspaceState)}</code>
        </div>
      ) : null}
      <div className="flex items-center gap-3">
        <Button onClick={handleSplit} size="sm">
          Split Array
        </Button>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
      <pre className="text-sm whitespace-pre-wrap rounded border p-3 bg-muted">
{output || "Result will appear here."}
      </pre>
    </div>
  )
}
