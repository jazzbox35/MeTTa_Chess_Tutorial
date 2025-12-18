"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { splitParenthesizedArray } from "@/lib/split-parenthesized-array"

export function SplitDemo() {
  const [input, setInput] = useState("[ (data1), (data2) ]")
  const [output, setOutput] = useState("")
  const [error, setError] = useState<string | null>(null)

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
