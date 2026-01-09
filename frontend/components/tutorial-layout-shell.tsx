"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"

interface TutorialLayoutShellProps {
  left: ReactNode
  right: ReactNode
  children: ReactNode
  showToggle?: boolean
}

export function TutorialLayoutShell({ left, right, children, showToggle = false }: TutorialLayoutShellProps) {
  const [showRight, setShowRight] = useState(true)

  const gridCols = showRight
    ? "grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px]"
    : "grid-cols-1 md:grid-cols-[280px_1fr]"

  return (
    <div className="py-8">
      {showToggle && (
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowRight((prev) => !prev)}
          >
            {showRight ? "Hide On This Page" : "Show On This Page"}
          </Button>
        </div>
      )}

      <div className={`grid ${gridCols} gap-6`}>
        <div className="hidden md:block">{left}</div>
        <div className="min-w-0">{children}</div>
        {showRight && (
          <div className="hidden xl:block">
            {right}
          </div>
        )}
      </div>
    </div>
  )
}
