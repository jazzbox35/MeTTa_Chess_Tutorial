"use client"

import React, { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FRONTEND_BASE_URL } from "@/lib/constants"
import { splitParenthesizedArray } from "@/lib/split-parenthesized-array"

const pieces = {
  r: "♜",
  n: "♞",
  b: "♝",
  q: "♛",
  k: "♚",
  p: "♟︎",
}

const setup = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["", "", "", "", "", "", "", ""],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  ["r", "n", "b", "q", "k", "b", "n", "r"],
]

const files = ["A", "B", "C", "D", "E", "F", "G", "H"]

type BoardCell = { color: "gold" | "silver"; piece: string } | null

function extractBoardStateSection(state: string): {
  boardStateSection: string | null
  gameStateSection: string | null
} {
  let depth = 0
  let boardStateSection: string | null = null
  let gameStateSection: string | null = null

  const captureSExpression = (startIndex: number) => {
    let innerDepth = 0
    for (let j = startIndex; j < state.length; j++) {
      const cj = state[j]
      if (cj === "(") innerDepth++
      if (cj === ")") {
        innerDepth--
        if (innerDepth === 0) {
          return state.slice(startIndex, j + 1)
        }
      }
    }
    return null
  }

  for (let i = 0; i < state.length; i++) {
    const ch = state[i]

    if (ch === "(") {
      if (depth === 0) {
        const rest = state.slice(i + 1)
        if (boardStateSection === null && /^\s*board-state\b/.test(rest)) {
          boardStateSection = captureSExpression(i)
        }
        if (gameStateSection === null && /^\s*game-state\b/.test(rest)) {
          gameStateSection = captureSExpression(i)
        }
        if (boardStateSection && gameStateSection) break
      }
      depth++
    } else if (ch === ")") {
      depth = Math.max(depth - 1, 0)
    }
  }

  return { boardStateSection, gameStateSection }
}

function buildInitialBoard(): BoardCell[][] {
  return setup.map((row, rowIdx) =>
    row.map((cell) => {
      if (!cell) return null
      const color: "gold" | "silver" = rowIdx < 2 ? "gold" : rowIdx > 5 ? "silver" : "gold"
      return { color, piece: cell }
    }),
  )
}

function parseBoardState(section: string): BoardCell[][] | null {
  const board: BoardCell[][] = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => null),
  )

  // Expect entries like (x y color piece) with optional color or piece for empties
  const entryRegex = /\(\s*([0-9]+)\s+([0-9]+)(?:\s+([a-zA-Z]+))?(?:\s+([a-zA-Z]+))?\s*\)/g
  let match: RegExpExecArray | null

  while ((match = entryRegex.exec(section)) !== null) {
    const x = Number.parseInt(match[1], 10)
    const y = Number.parseInt(match[2], 10)
    if (x < 1 || x > 8 || y < 1 || y > 8) continue

    const tokenA = match[3]?.toLowerCase() ?? ""
    const tokenB = match[4]?.toLowerCase() ?? ""
    const tokens = [tokenA, tokenB].filter(Boolean)

    if (tokens.length === 0) {
      board[8 - y][x - 1] = null
      continue
    }

    let color: "gold" | "silver" | null = null
    let piece = ""

    for (const token of tokens) {
      if (!color && (token === "g" || token === "gold")) {
        color = "gold"
        continue
      }
      if (!color && (token === "s" || token === "silver")) {
        color = "silver"
        continue
      }
      if (!piece && token.length === 1) {
        piece = token
      }
    }

    if (!piece) continue
    if (!color) {
      // Fallback: top side gold, bottom side silver
      color = y >= 5 ? "gold" : "silver"
    }

    board[8 - y][x - 1] = { color, piece }
  }

  return board
}

function parseGameState(section: string): string | null {
  const match = section.match(/\(\s*game-state\s+([^)]+?)\s*\)/i)
  return match ? match[1].trim() : null
}

const hasAtomspaceContent = (value: string | null | undefined): boolean => {
  const trimmed = (value || "").trim()
  return !!trimmed && trimmed !== "[]" && trimmed !== "()"
}

export function ChessClient() {
  const [board, setBoard] = useState<BoardCell[][]>(() => buildInitialBoard())
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isWaiting, setIsWaiting] = useState(false)
  const [gameState, setGameState] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [atomspacePresent, setAtomspacePresent] = useState<boolean>(false)
  const [firstClick, setFirstClick] = useState<{ x1: number; y1: number } | null>(null)
  const [secondClick, setSecondClick] = useState<{ x2: number; y2: number } | null>(null)
  const [highlightedSquares, setHighlightedSquares] = useState<Array<{ x: number; y: number }>>([])
  const lastTokenRef = useRef<string | null>(null)
  const alertedTokenRef = useRef<string | null>(null)
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastAutoStartTokenRef = useRef<string | null>(null)

  const startReset = (token?: string) => {
    const tok = token ?? `${Date.now()}:${Math.random().toString(16).slice(2)}`
    lastTokenRef.current = tok
    setIsWaiting(true)
    if (waitTimerRef.current) clearTimeout(waitTimerRef.current)
    waitTimerRef.current = setTimeout(() => {
      setIsWaiting(false)
      waitTimerRef.current = null
    }, 15000)
    void runPlayChess(tok)
    setTestResult(null)
  }

  const runPlayChess = async (token: string) => {
    try {
      const atomspaceState =
        (globalThis as any).Atomspace_state ??
        (() => {
          try {
            return window.localStorage.getItem("Atomspace_state")
          } catch {
            return ""
          }
        })() ??
        ""

      const payload = atomspaceState ? `${atomspaceState}\n!(S)` : "!(S)"
      const response = await fetch(`${FRONTEND_BASE_URL}/metta_stateless`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: payload,
      })

      const fullText = await response.text()
      const matches = fullText.match(/\[[^\]]*\]/g) || []
      const text = matches[0] || fullText
      setTestResult(text)

      const second = matches[1] || null
      if (second) {
        try {
          const normalizedAtomspaceState = splitParenthesizedArray(second)
          ;(globalThis as any).Atomspace_state = normalizedAtomspaceState
          window.localStorage.setItem("Atomspace_state", normalizedAtomspaceState)
          window.dispatchEvent(
            new CustomEvent("atomspace_state_updated", { detail: normalizedAtomspaceState }),
          )

          const { boardStateSection, gameStateSection } = extractBoardStateSection(normalizedAtomspaceState)
          if (boardStateSection) {
            window.localStorage.setItem("board_state", boardStateSection)
            window.dispatchEvent(
              new CustomEvent("board_state_updated", { detail: boardStateSection }),
            )
          }
          if (gameStateSection) {
            window.localStorage.setItem("game_state", gameStateSection)
            window.dispatchEvent(
              new CustomEvent("game_state_updated", { detail: gameStateSection }),
            )
          }
        } catch {
          // ignore atomspace update errors
        }
      }
    } catch (err) {
      setTestResult(`error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsWaiting(false)
      if (waitTimerRef.current) {
        clearTimeout(waitTimerRef.current)
        waitTimerRef.current = null
      }
    }
  }

  const runMoveChess = async (coords: { x1: number; y1: number; x2: number; y2: number }) => {
    try {
      const atomspaceState =
        (globalThis as any).Atomspace_state ??
        (() => {
          try {
            return window.localStorage.getItem("Atomspace_state")
          } catch {
            return ""
          }
        })() ??
        ""

      const move = `!(M (${coords.x1} ${coords.y1}) (${coords.x2} ${coords.y2}))`
      const payload = atomspaceState ? `${atomspaceState}\n${move}` : move
      const response = await fetch(`${FRONTEND_BASE_URL}/metta_stateless`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: payload,
      })

      const fullText = await response.text()
      const matches = fullText.match(/\[[^\]]*\]/g) || []
      const text = matches[0] || fullText
      setTestResult(text)

      const second = matches[1] || null
      if (second) {
        try {
          const normalizedAtomspaceState = splitParenthesizedArray(second)
          ;(globalThis as any).Atomspace_state = normalizedAtomspaceState
          window.localStorage.setItem("Atomspace_state", normalizedAtomspaceState)
          window.dispatchEvent(
            new CustomEvent("atomspace_state_updated", { detail: normalizedAtomspaceState }),
          )

          const { boardStateSection, gameStateSection } = extractBoardStateSection(normalizedAtomspaceState)
          if (boardStateSection) {
            window.localStorage.setItem("board_state", boardStateSection)
            window.dispatchEvent(
              new CustomEvent("board_state_updated", { detail: boardStateSection }),
            )
          }
          if (gameStateSection) {
            window.localStorage.setItem("game_state", gameStateSection)
            window.dispatchEvent(
              new CustomEvent("game_state_updated", { detail: gameStateSection }),
            )
          }
        } catch {
          // ignore atomspace update errors
        }
      }
    } catch (err) {
      setTestResult(`error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  useEffect(() => {
    const handleResult = (token: string | null, result: string | null) => {
      if (!token || result == null) return
      if (lastTokenRef.current && lastTokenRef.current !== token) return
      setTestResult(result)
      setIsWaiting(false)
      if (waitTimerRef.current) {
        clearTimeout(waitTimerRef.current)
        waitTimerRef.current = null
      }
      if (alertedTokenRef.current !== token) {
        alertedTokenRef.current = token
        alert(`Result: ${result}`)
      }
    }

    const customHandler = (event: CustomEvent<{ token?: string; result?: string }>) => {
      handleResult(event.detail?.token ?? null, event.detail?.result ?? null)
    }

    const storageHandler = (event: StorageEvent) => {
      if (event.key === "play_chess_response" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as { token?: string; result?: string }
          handleResult(parsed.token ?? null, parsed.result ?? null)
        } catch {
          // ignore malformed payload
          setIsWaiting(false)
          if (waitTimerRef.current) {
            clearTimeout(waitTimerRef.current)
            waitTimerRef.current = null
          }
        }
      }
    }

    window.addEventListener("play_chess_response", customHandler as EventListener)
    window.addEventListener("storage", storageHandler)
    return () => {
      window.removeEventListener("play_chess_response", customHandler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  useEffect(() => {
    const applyBoardState = (section: string) => {
      const parsed = parseBoardState(section)
      if (parsed) setBoard(parsed)
    }

    // Load any saved board state on mount
    try {
      const stored = window.localStorage.getItem("board_state")
      if (stored) applyBoardState(stored)
    } catch {
      // ignore storage errors
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      if (detail) applyBoardState(detail)
    }
    window.addEventListener("board_state_updated", handler as EventListener)

    const storageHandler = (event: StorageEvent) => {
      if (event.key === "board_state" && event.newValue) {
        applyBoardState(event.newValue)
      }
    }
    window.addEventListener("storage", storageHandler)

    return () => {
      window.removeEventListener("board_state_updated", handler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  useEffect(() => {
    const applyGameState = (section: string) => {
      const parsed = parseGameState(section)
      setGameState(parsed ?? null)
    }

    // Load any saved game state on mount
    try {
      const stored = window.localStorage.getItem("game_state")
      if (stored) applyGameState(stored)
    } catch {
      // ignore storage errors
    }

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      applyGameState(detail)
    }
    window.addEventListener("game_state_updated", handler as EventListener)

    const storageHandler = (event: StorageEvent) => {
      if (event.key === "game_state" && event.newValue) {
        applyGameState(event.newValue)
      }
    }
    window.addEventListener("storage", storageHandler)

    return () => {
      window.removeEventListener("game_state_updated", handler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  useEffect(() => {
    const handleReset = (value: string) => {
      const present = hasAtomspaceContent(value)
      setAtomspacePresent(present)
      if (!present) {
        setTestResult(null)
        setGameState(null)
      }
    }

    const atomspaceHandler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      handleReset(detail)
    }
    const storageHandler = (event: StorageEvent) => {
      if (event.key === "Atomspace_state") {
        handleReset(event.newValue ?? "")
      }
    }

    window.addEventListener("atomspace_state_updated", atomspaceHandler as EventListener)
    window.addEventListener("storage", storageHandler)
    return () => {
      window.removeEventListener("atomspace_state_updated", atomspaceHandler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (waitTimerRef.current) {
        clearTimeout(waitTimerRef.current)
        waitTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const initial =
      (globalThis as any).Atomspace_state ??
      (() => {
        try {
          return window.localStorage.getItem("Atomspace_state")
        } catch {
          return ""
        }
      })() ??
      ""
    setAtomspacePresent(hasAtomspaceContent(initial))
    try {
      window.localStorage.setItem("chess_tab_open", Date.now().toString())
    } catch {
      // ignore storage errors
    }

    const clearFlag = () => {
      try {
        window.localStorage.removeItem("chess_tab_open")
      } catch {
        // ignore storage errors
      }
    }
    window.addEventListener("beforeunload", clearFlag)
    return () => {
      window.removeEventListener("beforeunload", clearFlag)
      clearFlag()
    }
  }, [])

  useEffect(() => {
    if (!atomspacePresent) {
      setHighlightedSquares([])
    }
  }, [atomspacePresent])

  useEffect(() => {
    const AUTO_START_KEY = "auto_start_chess"
    const consumeToken = (token: string | null | undefined) => {
      if (!token || token === lastAutoStartTokenRef.current) return
      lastAutoStartTokenRef.current = token
      try {
        window.localStorage.removeItem(AUTO_START_KEY)
      } catch {
        // ignore storage errors
      }
      startReset(token)
    }

    // Check for a pending token on mount
    try {
      const existing = window.localStorage.getItem(AUTO_START_KEY)
      if (existing) consumeToken(existing)
    } catch {
      // ignore storage errors
    }

    const storageHandler = (event: StorageEvent) => {
      if (event.key === AUTO_START_KEY && event.newValue) {
        consumeToken(event.newValue)
      }
    }
    const customHandler = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail ?? ""
      consumeToken(detail)
    }

    window.addEventListener("storage", storageHandler)
    window.addEventListener(AUTO_START_KEY, customHandler as EventListener)
    return () => {
      window.removeEventListener("storage", storageHandler)
      window.removeEventListener(AUTO_START_KEY, customHandler as EventListener)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col gap-4 items-center justify-center px-2 sm:px-4">
      <Button
        size="sm"
        variant="outline"
        className="bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700 disabled:opacity-60"
        disabled={!mounted || !atomspacePresent}
        onClick={() => startReset()}
      >
        START/RESET
      </Button>
      {isWaiting && (
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Waiting for PlayChess...</span>
        </div>
      )}
      {gameState && gameState.toLowerCase().includes("checkmate") && (
        <div className="w-full flex items-center justify-center py-2 rounded bg-red-600 text-white text-lg font-bold animate-pulse">
          CHECKMATE!
        </div>
      )}
      {testResult !== null && (
        <div className="text-sm text-slate-200">MeTTa Response&gt; {testResult}</div>
      )}

      <div className="bg-slate-800 p-3 sm:p-4 rounded-xl shadow-2xl shadow-black/50">
        <div className="grid grid-cols-[auto_repeat(8,_1fr)_auto] grid-rows-[auto_repeat(8,_1fr)_auto] gap-0">
          {/* top file labels */}
          <div />
          {files.map((file) => (
            <div key={`top-${file}`} className="h-5 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs text-slate-300">
              {file}
            </div>
          ))}
          <div />

          {/* board rows with rank labels */}
          {board.map((row, rowIdx) => (
            <React.Fragment key={`row-${rowIdx}`}>
              <div className="w-5 h-10 sm:w-6 sm:h-14 md:h-16 flex items-center justify-center text-[10px] sm:text-xs text-slate-300">
                {8 - rowIdx}
              </div>
              {row.map((cell, colIdx) => {
                const isDark = (rowIdx + colIdx) % 2 === 0
                const isHighlighted = highlightedSquares.some(
                  (sq) => sq.x === colIdx + 1 && sq.y === 8 - rowIdx,
                )
                const colorClass =
                  cell?.color === "gold"
                    ? atomspacePresent
                      ? "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                      : "text-amber-200/70"
                    : cell?.color === "silver"
                      ? atomspacePresent
                        ? "text-slate-200 drop-shadow-[0_0_6px_rgba(226,232,240,0.8)]"
                        : "text-slate-300/70"
                      : "text-slate-100"

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-xl sm:text-2xl md:text-3xl ${
                      isHighlighted
                        ? atomspacePresent
                          ? "bg-amber-400/30"
                          : "bg-slate-600"
                        : isDark
                          ? "bg-slate-700"
                          : "bg-slate-600"
                    }`}
                    onClick={() => {
                      if (!mounted || !atomspacePresent) return
                      // Only capture moves when START/RESET is enabled (atomspace present)
                      if (!atomspacePresent) return
                      const x = colIdx + 1
                      const y = 8 - rowIdx
                      if (!firstClick) {
                        if (!cell || cell.color !== "silver") return
                        setFirstClick({ x1: x, y1: y })
                        setSecondClick(null)
                        setHighlightedSquares([{ x, y }])
                        return
                      }
                      if (firstClick.x1 === x && firstClick.y1 === y) return
                      // Allow changing the origin by clicking another silver piece
                      if (cell?.color === "silver") {
                        setFirstClick({ x1: x, y1: y })
                        setSecondClick(null)
                        setHighlightedSquares([{ x, y }])
                        return
                      }
                      const next = { x2: x, y2: y }
                      const highlights = [
                        { x: firstClick.x1, y: firstClick.y1 },
                        { x: next.x2, y: next.y2 },
                      ]
                      setSecondClick(next)
                      setHighlightedSquares(highlights)
                      void runMoveChess({
                        x1: firstClick.x1,
                        y1: firstClick.y1,
                        x2: next.x2,
                        y2: next.y2,
                      }).finally(() => {
                        setHighlightedSquares([])
                        setFirstClick(null)
                        setSecondClick(null)
                      })
                    }}
                  >
                    <span className={colorClass}>
                      {cell ? pieces[cell.piece as keyof typeof pieces] ?? "" : ""}
                    </span>
                  </div>
                )
              })}
              <div className="w-5 h-10 sm:w-6 sm:h-14 md:h-16 flex items-center justify-center text-[10px] sm:text-xs text-slate-300">
                {8 - rowIdx}
              </div>
            </React.Fragment>
          ))}

          {/* bottom file labels */}
          <div />
          {files.map((file) => (
            <div key={`bottom-${file}`} className="h-5 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs text-slate-300">
              {file}
            </div>
          ))}
          <div />
        </div>
      </div>
      {gameState && (
        <div className="text-sm text-slate-200">Game state: {gameState}</div>
      )}
    </div>
  )
}
