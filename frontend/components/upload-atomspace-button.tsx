"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"

function extractSections(state: string): { board?: string; game?: string } {
  let depth = 0
  let board: string | undefined
  let game: string | undefined

  const capture = (start: number) => {
    let inner = 0
    for (let i = start; i < state.length; i++) {
      const ch = state[i]
      if (ch === "(") inner++
      if (ch === ")") {
        inner--
        if (inner === 0) return state.slice(start, i + 1)
      }
    }
    return undefined
  }

  for (let i = 0; i < state.length; i++) {
    const ch = state[i]
    if (ch === "(") {
      if (depth === 0) {
        const rest = state.slice(i + 1)
        if (!board && /^\s*board-state\b/i.test(rest)) board = capture(i)
        if (!game && /^\s*game-state\b/i.test(rest)) game = capture(i)
        if (board && game) break
      }
      depth++
    } else if (ch === ")") {
      depth = Math.max(depth - 1, 0)
    }
  }
  return { board, game }
}

export function UploadAtomspaceButton() {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text()
      ;(globalThis as any).Atomspace_state = text
      try {
        window.localStorage.setItem("Atomspace_state", text)
      } catch {
        // ignore storage errors
      }
      const { board, game } = extractSections(text)
      if (board) {
        try {
          window.localStorage.setItem("board_state", board)
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent("board_state_updated", { detail: board }))
      }
      if (game) {
        try {
          window.localStorage.setItem("game_state", game)
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent("game_state_updated", { detail: game }))
      }
      window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: text }))
    } catch (err) {
      console.error("Failed to upload atomspace", err)
      alert("Failed to upload atomspace.")
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".metta,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            void handleUpload(file)
            e.target.value = ""
          }
        }}
      />
      <Button
        variant="outline"
        onClick={() => {
          inputRef.current?.click()
        }}
        className="text-sm"
      >
        Upload Chess Program
      </Button>
    </>
  )
}
