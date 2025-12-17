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

interface CodeEditorProps {
  code: string
  language: string
  readOnly?: boolean
  showLineNumbers?: boolean
  className?: string
  codeId:number
}

export function CodeEditor({
  code: initialCode,
  codeId,
  language = "metta",
  readOnly: initialReadOnly = false,
  showLineNumbers = true,
  className = "",
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode)
  const [readOnly, setReadOnly] = useState(initialReadOnly)
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

  const isDarkMode = mounted && resolvedTheme === "dark"

  // Reset code to initial value . only when explicitly called
  // Reset result output
 const handleResetCode = async () => {
  try {
    const response = await fetch(`${FRONTEND_BASE_URL}/reset-to-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ codeId }),
    });

    if (!response.ok) {
      throw new Error(
        `Reset API returned status ${response.status}: ${response.statusText}`
      );
    }
      setCode(initialCode);
      setOutput("");
      setError(null);
      setHasRun(false);
    
  } catch (err) {
    console.error("Reset code failed:", err);
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    setIsExecuting(false);
  }
}

  // Reset result output
 const handleResetResult = async () => {
  try {
    const response = await fetch(`${FRONTEND_BASE_URL}/reset-to-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ codeId }),
    });


    setOutput("")
    setError(null)
    setHasRun(false)
    
  } catch (err) {
    console.error("Reset code failed:", err);
    setError(err instanceof Error ? err.message : String(err));
  } finally {
    setIsExecuting(false);
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

  // Execute code by sending to MeTTa API
  const executeCode = async () => {
    setIsExecuting(true)
    setOutput("")
    setError(null)

    try {
      // Prepare the request to the MeTTa API (same shape as /metta_stateless)
      const response = await fetch(`${FRONTEND_BASE_URL}/metta`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: code,
      })

      if (!response.ok) {
        throw new Error(`Metta API returned ${response.status}`)
      }

      // Display raw response text (e.g., "[3]"), matching stateless call style
      const text = await response.text()
      setOutput(text || "")
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
        <div className="group flex items-center justify-between bg-muted p-1 border-b">
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
          </div>
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
    </div>
  )
}
