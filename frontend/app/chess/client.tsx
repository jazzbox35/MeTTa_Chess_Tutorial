"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

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

export function ChessClient() {
  const [testResult, setTestResult] = useState<string | null>(null)
  const lastTokenRef = useRef<string | null>(null)
  const alertedTokenRef = useRef<string | null>(null)

  useEffect(() => {
    const handleResult = (token: string | null, result: string | null) => {
      if (!token || !result) return
      if (lastTokenRef.current && lastTokenRef.current !== token) return
      setTestResult(result)
      if (alertedTokenRef.current !== token) {
        alertedTokenRef.current = token
        alert(`Result: ${result}`)
      }
    }

    const customHandler = (event: CustomEvent<{ token?: string; result?: string }>) => {
      handleResult(event.detail?.token ?? null, event.detail?.result ?? null)
    }

    const storageHandler = (event: StorageEvent) => {
      if (event.key === "test_add_response" && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue) as { token?: string; result?: string }
          handleResult(parsed.token ?? null, parsed.result ?? null)
        } catch {
          // ignore malformed payload
        }
      }
    }

    window.addEventListener("test_add_response", customHandler as EventListener)
    window.addEventListener("storage", storageHandler)
    return () => {
      window.removeEventListener("test_add_response", customHandler as EventListener)
      window.removeEventListener("storage", storageHandler)
    }
  }, [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col gap-4 items-center justify-center px-2 sm:px-4">
      <Button
        size="sm"
        variant="outline"
        className="bg-slate-800 text-slate-100 border-slate-600 hover:bg-slate-700"
        onClick={() => {
          const token = `${Date.now()}:${Math.random().toString(16).slice(2)}`
          lastTokenRef.current = token
          try {
            window.localStorage.setItem("test_add_request", token)
          } catch {
            // ignore storage errors
          }
          const target = window.opener && !window.opener.closed ? window.opener : window
          target.dispatchEvent(new CustomEvent("test_add_request", { detail: { token } }))
          setTestResult(null)
        }}
      >
        PLAY
      </Button>
      {testResult && (
        <div className="text-sm text-slate-200">Result: {testResult}</div>
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
          {setup.map((row, rowIdx) => (
            <React.Fragment key={`row-${rowIdx}`}>
              <div className="w-5 h-10 sm:w-6 sm:h-14 md:h-16 flex items-center justify-center text-[10px] sm:text-xs text-slate-300">
                {8 - rowIdx}
              </div>
              {row.map((cell, colIdx) => {
                const isDark = (rowIdx + colIdx) % 2 === 0
                const isGoldSide = rowIdx < 2
                const isSilverSide = rowIdx > 5
                const colorClass = isGoldSide
                  ? "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  : isSilverSide
                    ? "text-slate-200 drop-shadow-[0_0_6px_rgba(226,232,240,0.8)]"
                    : "text-slate-100"

                return (
                  <div
                    key={`${rowIdx}-${colIdx}`}
                    className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-xl sm:text-2xl md:text-3xl ${
                      isDark ? "bg-slate-700" : "bg-slate-600"
                    }`}
                  >
                    <span className={colorClass}>{cell ? pieces[cell as keyof typeof pieces] : ""}</span>
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
    </div>
  )
}
