"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Check, Clipboard, Play, Lock, Unlock, RefreshCw, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"

// Import the custom MeTTa highlighter hook
import { useMeTTaHighlighter } from "@/hooks/useMeTTaHighlighter"
import { FRONTEND_BASE_URL } from "@/lib/constants"
import { splitParenthesizedArray } from "@/lib/split-parenthesized-array"

const INITIAL_BOARD_STATE =
  "(board-state ((1 8 g r) (2 8 g n) (3 8 g b) (4 8 g q) (5 8 g k) (6 8 g b) (7 8 g n) (8 8 g r) (1 7 g p) (2 7 g p) (3 7 g p) (4 7 g p) (5 7 g p) (6 7 g p) (7 7 g p) (8 7 g p) (1 6) (2 6) (3 6) (4 6) (5 6) (6 6) (7 6) (8 6) (1 5) (2 5) (3 5) (4 5) (5 5) (6 5) (7 5) (8 5) (1 4) (2 4) (3 4) (4 4) (5 4) (6 4) (7 4) (8 4) (1 3) (2 3) (3 3) (4 3) (5 3) (6 3) (7 3) (8 3) (1 2 s p) (2 2 s p) (3 2 s p) (4 2 s p) (5 2 s p) (6 2 s p) (7 2 s p) (8 2 s p) (1 1 s r) (2 1 s n) (3 1 s b) (4 1 s q) (5 1 s k) (6 1 s b) (7 1 s n) (8 1 s r)))"

// Extract the first "(board-state ...)" s-expression from the atomspace string.
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
      // Only consider board-state at top-level (depth 0)
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

interface CodeEditorProps {
  code: string
  language: string
  hideRun?: boolean
  readOnly?: boolean
  showLineNumbers?: boolean
  className?: string
  codeId:number
  cheatContent?: string
  cheatLabel?: string
  resetWithGreedyBeforeRun?: boolean
}

export function CodeEditor({
  code: initialCode,
  codeId,
  language = "metta",
  hideRun = false,
  readOnly: initialReadOnly = false,
  showLineNumbers = true,
  className = "",
  cheatContent,
  cheatLabel = "Cheat",
  resetWithGreedyBeforeRun = false,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [readOnly, setReadOnly] = useState(initialReadOnly || hideRun)
  const [output, setOutput] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const codeTextareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLPreElement>(null)
  const resultTextareaRef = useRef<HTMLTextAreaElement>(null)

  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Use the custom MeTTa highlighter hook
  const { highlightedCode, prismLoaded, isLoading: highlighterLoading, error: highlighterError } = useMeTTaHighlighter(code)
  
  // Ensure highlighter updates immediately when code changes, especially when empty
  const displayHighlightedCode = code === "" ? "" : highlightedCode

  useEffect(() => {
    setMounted(true)
  }, [])

  // Allow external triggers (e.g., after loading default program) to execute the current code
  useEffect(() => {
    if (typeof window === "undefined") return
    const handler = () => {
      void executeCode()
    }
    window.addEventListener("execute_code_editor", handler)
    return () => window.removeEventListener("execute_code_editor", handler)
  })

  const isDarkMode = mounted && resolvedTheme === "dark"

  // Reset code to initial value . only when explicitly called
  // Reset result output
 const handleResetCode = () => {
    setCode(initialCode)
    setOutput("")
    setError(null)
    setHasRun(false)
    setIsExecuting(false)
}

  // Reset result output
 const handleResetResult = () => {
    setOutput("")
    setError(null)
    setHasRun(false)
    setIsExecuting(false)
}

  const resetAtomspaceWithGreedy = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${FRONTEND_BASE_URL}/default-program`)
      if (!res.ok) {
        throw new Error(`Failed to load default program (${res.status})`)
      }
      const program = (await res.text()).trim()

      ;(globalThis as any).Atomspace_state = program
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("Atomspace_state", program)
          window.localStorage.setItem("board_state", INITIAL_BOARD_STATE)
          window.localStorage.setItem("game_state", "")
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: program }))
        window.dispatchEvent(new CustomEvent("board_state_updated", { detail: INITIAL_BOARD_STATE }))
        window.dispatchEvent(new CustomEvent("game_state_updated", { detail: "" }))
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      return false
    }
  }

  // Toggle read-only mode
  const toggleReadOnly = () => {
    setReadOnly(!readOnly)
  }

  // Copy code to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleAtomspaceUpdate = async (second: string | null) => {
    if (typeof window === "undefined") {
      return
    }

    let normalizedAtomspaceState: string | null = null

    try {
      if (second !== null) {
        normalizedAtomspaceState = splitParenthesizedArray(second)
        ;(globalThis as any).Atomspace_state = normalizedAtomspaceState
        const { boardStateSection, gameStateSection } = extractBoardStateSection(normalizedAtomspaceState)
        if (boardStateSection) {
          try {
            window.localStorage.setItem("board_state", boardStateSection)
          } catch {
            // ignore storage errors
          }
          window.dispatchEvent(
            new CustomEvent("board_state_updated", { detail: boardStateSection }),
          )
        }
        if (gameStateSection) {
          try {
            window.localStorage.setItem("game_state", gameStateSection)
          } catch {
            // ignore storage errors
          }
          window.dispatchEvent(
            new CustomEvent("game_state_updated", { detail: gameStateSection }),
          )
        }
      } else {
        ;(globalThis as any).Atomspace_state = null
      }
    } catch {
      alert("Unable to assign atomspace")
      ;(globalThis as any).Atomspace_state = null
    }
    window.dispatchEvent(
      new CustomEvent("atomspace_state_updated", { detail: normalizedAtomspaceState ?? "" }),
    )
  }

  // Execute code by sending to MeTTa API
  const executeCode = async () => {
    setIsExecuting(true)
    setOutput("")
    setError(null)

    try {
      if (resetWithGreedyBeforeRun) {
        const resetOk = await resetAtomspaceWithGreedy()
        if (!resetOk) {
          setIsExecuting(false)
          setHasRun(true)
          return
        }
      }
      const atomspaceState = (globalThis as any).Atomspace_state ?? ""

      // THIS PROGRAM RETAINS THE USER'S ATOMSPACE. THE SERVER DOES NOT RETAIN ATOMSPACE.
      // Attach the present query to the present atomspace for submission
      let payload
      if (!atomspaceState) {
        payload = code
      } else {
        payload = `${atomspaceState}\n${code}`
      }

      // Submit the query along with atomspace. Server returns:
      //  [ result of query ] [ updated atomspace ]
      //
      const response = await fetch(`${FRONTEND_BASE_URL}/metta_stateless`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: payload,
      })

      // Display only the first bracketed result if multiple are returned (e.g., "[first] [second]")
      const fullText = await response.text()
      const matches = fullText.match(/\[[^\]]*\]/g) || []
      const text = matches[0] || fullText
      setOutput(text || "")

      // Trap for bad response code or JSON with an error message.
      if (response.status !== 200
        || fullText.includes('{"error"'))
      { 
        // Don't delete atomspace on query fail, just exit.
        setError(`Metta query failed`)
        setIsExecuting(false)
        setHasRun(true)
        return
      }
      // Expose second result (if present) globally for app-wide use
      const second = matches[1] || null
      await handleAtomspaceUpdate(second)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      console.error("Execution error:", err)
    } finally {
      setIsExecuting(false)
      setHasRun(true)
    }
  }

  // Sync scroll between textarea and highlight
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement
    if (highlightRef.current) {
      highlightRef.current.scrollTop = target.scrollTop
      highlightRef.current.scrollLeft = target.scrollLeft
    }
  }

  // Auto-resize textarea based on content
  useEffect(() => {
    if (codeTextareaRef.current && highlightRef.current) {
      const textarea = codeTextareaRef.current
      textarea.style.height = "auto"
      const scrollHeight = Math.max(textarea.scrollHeight, 60)
      textarea.style.height = `${scrollHeight}px`
      highlightRef.current.style.height = `${scrollHeight}px`
    }
  }, [code])

  // Auto-resize result textarea based on content
  useEffect(() => {
    if (resultTextareaRef.current) {
      resultTextareaRef.current.style.height = "auto"
      resultTextareaRef.current.style.height = `${resultTextareaRef.current.scrollHeight}px`
    }
  }, [output, error])

  // Handle tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const start = e.currentTarget.selectionStart
      const end = e.currentTarget.selectionEnd
      const newCode = code.substring(0, start) + "  " + code.substring(end)
      setCode(newCode)

      // Set cursor position after inserted tab
      setTimeout(() => {
        if (codeTextareaRef.current) {
          codeTextareaRef.current.selectionStart = start + 2
          codeTextareaRef.current.selectionEnd = start + 2
        }
      }, 0)
    }
  }

  // Get the button based on execution state
  const getExecutionButton = () => {
    if (hideRun) return null
    if (isExecuting) {
      return (
        <Button variant="secondary" size="sm" disabled className="flex items-center gap-2">
          <Loader className="h-4 w-4 animate-spin" />
          Running...
        </Button>
      )
    } else if (hasRun) {
      return (
        <Button variant="outline" size="sm" onClick={handleResetResult} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Reset
        </Button>
      )
    } else {
      return (
        <Button variant="outline" size="sm" onClick={executeCode} className="flex items-center gap-2">
          <Play className="h-6 w-6" />
          Run
        </Button>
      )
    }
  }

  // Get the content to display in the result area
  const getResultContent = () => {
    if (isExecuting) {
      return "Executing code..."
    } else if (error) {
      return error
    } else if (output) {
      return output
    } else {
      return ""
    }
  }

  return (
    <div className={`code-editor-container ${className}`}>
      {/* Code Editor */}
      <Card className="border rounded-md overflow-hidden mb-4">
        <div className={`group flex items-center justify-between bg-muted p-1 ${hideRun ? "" : "border-b"}`}>
          <div className="flex items-center gap-2">
            <Badge variant="outline">MeTTa</Badge>
            {highlighterLoading && (
              <Badge variant="secondary" className="text-xs">
                Loading highlighter...
              </Badge>
            )}
            {highlighterError && (
              <Badge variant="destructive" className="text-xs">
                Highlighter error
              </Badge>
            )}
          </div>
          {!hideRun && (
          <div className="flex items-center gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleReadOnly}>
                    {readOnly ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{readOnly ? "Unlock editor" : "Lock editor"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                    {isCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isCopied ? "Copied!" : "Copy code"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleResetCode}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset code</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {cheatContent && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2"
                      onClick={() => {
                        setCode(cheatContent)
                        setOutput("")
                        setError(null)
                        setHasRun(false)
                      }}
                    >
                      {cheatLabel}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Display answer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          )}
        </div>

        <div className="relative">
          {/* Syntax highlighted code display */}
          <pre
            ref={highlightRef}
            className="w-full font-mono text-sm p-4 m-0 absolute top-0 left-0 right-0 bottom-0 pointer-events-none overflow-auto whitespace-pre-wrap"
            style={{ lineHeight: "1.5" }}
          >
            {prismLoaded && code !== "" ? (
              <code className="language-metta" dangerouslySetInnerHTML={{ __html: displayHighlightedCode }} />
            ) : (
              <code className="language-metta">{code}</code>
            )}
          </pre>

          <textarea
            ref={codeTextareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            readOnly={readOnly}
            spellCheck={false}
            className="w-full font-mono text-sm p-4 resize-none relative z-10 bg-transparent focus:outline-none focus:ring-0 focus:border-none"
            style={{
              lineHeight: "1.5",
              tabSize: 2,
              color: "transparent",
              caretColor: !isDarkMode ? "black" : "white",
            }}
          />
        </div>
      </Card>

      {/* Result Editor */}
      {!hideRun && (
        <Card className={`${hasRun ? "overflow-hidden border rounded-md" : "border-none"}`}>
          <div className={`group flex items-center justify-between ${hasRun ? "bg-muted border-b p-2" : ""}`}>
            <div className="flex items-center gap-2">
              {getExecutionButton()}
              {(output || error) && <Badge variant={error ? "destructive" : "secondary"}>{error ? "Error" : ""}</Badge>}
            </div>
            {(output || error) && (
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(getResultContent())
                          setIsCopied(true)
                          setTimeout(() => setIsCopied(false), 2000)
                        }}
                      >
                        {isCopied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy result</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>

          <div className="relative">
            {!hasRun && !isExecuting ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground"></div>
            ) : (
              <textarea
                ref={resultTextareaRef}
                value={getResultContent()}
                readOnly
                className={`w-full font-mono text-sm p-4 resize-none focus:outline-none cursor-default bg-background ${
                  isExecuting ? "text-gray-500 dark:text-gray-400" : ""
                }`}
                style={{
                  lineHeight: "1.5",
                  minHeight: "40px",
                  height: "auto",
                  overflow: "hidden",
                  backgroundColor: error ? "rgba(254, 226, 226, 0.2)" : isExecuting ? "rgba(229, 231, 235, 0.2)" : "",
                }}
              />
            )}
            {isExecuting && (
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-background bg-opacity-70">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="text-sm font-medium">Executing code...</span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
