"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"

const AUTO_START_KEY = "auto_start_chess"
const CHESS_OPEN_KEY = "chess_tab_open"

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
  const [success, setSuccess] = useState(false)

  const handleUpload = async (file: File) => {
    try {
      const text = await file.text()
      ;(globalThis as any).Atomspace_state = text
      const chessTabOpen = (() => {
        try {
          return !!window.localStorage.getItem(CHESS_OPEN_KEY)
        } catch {
          return false
        }
      })()

      // Always update atomspace itself
      try {
        window.localStorage.setItem("Atomspace_state", text)
      } catch {
        // ignore storage errors
      }
      window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: text }))

      // If chess tab is not open, we can safely update board/game state and auto-start
      if (!chessTabOpen) {
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

        // Trigger auto-start on the chess page (in any tab)
        const token = `${Date.now()}:${Math.random().toString(16).slice(2)}`
        try {
          window.localStorage.setItem(AUTO_START_KEY, token)
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent(AUTO_START_KEY, { detail: token }))

        // Open or focus the chess tab and let it auto-start
        const chessWin = window.open("/chess", "metta-chess-tab")
        try {
          chessWin?.focus()
        } catch {
          // ignore focus errors
        }
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
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
      {success && (
        <div className="flex items-center gap-1 text-xs text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <span>Uploaded</span>
        </div>
      )}
    </>
  )
}
