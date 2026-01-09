"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/lib/constants";

const INITIAL_BOARD_STATE =
  "(board-state ((1 8 g r) (2 8 g n) (3 8 g b) (4 8 g q) (5 8 g k) (6 8 g b) (7 8 g n) (8 8 g r) (1 7 g p) (2 7 g p) (3 7 g p) (4 7 g p) (5 7 g p) (6 7 g p) (7 7 g p) (8 7 g p) (1 6) (2 6) (3 6) (4 6) (5 6) (6 6) (7 6) (8 6) (1 5) (2 5) (3 5) (4 5) (5 5) (6 5) (7 5) (8 5) (1 4) (2 4) (3 4) (4 4) (5 4) (6 4) (7 4) (8 4) (1 3) (2 3) (3 3) (4 3) (5 3) (6 3) (7 3) (8 3) (1 2 s p) (2 2 s p) (3 2 s p) (4 2 s p) (5 2 s p) (6 2 s p) (7 2 s p) (8 2 s p) (1 1 s r) (2 1 s n) (3 1 s b) (4 1 s q) (5 1 s k) (6 1 s b) (7 1 s n) (8 1 s r)))";

export function ResetButton() {
  const handleReset = async () => {
    try {
      const res = await fetch("/api/default-program")
      if (!res.ok) {
        throw new Error(`Failed to load default program (${res.status})`)
      }
      const program = (await res.text()).trim()

      ;(globalThis as any).Atomspace_state = program
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("Atomspace_state", program)
          window.localStorage.setItem("board_state", INITIAL_BOARD_STATE)
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: program }))
        window.dispatchEvent(new CustomEvent("board_state_updated", { detail: INITIAL_BOARD_STATE }))
      }
      alert("Now running default MeTTa chess program.")
    } catch (err) {
      console.error(err)
      alert("Failed to load default program.")
    }
  };

  return (
    <Button variant="outline" size="sm" className="text-xs h-9 w-full" onClick={handleReset}>
      {/* Icon for small screens (hidden on md and up) */}
      <RefreshCcw className="h-4 w-4 md:hidden" />

      {/* Text for medium screens and up */}
      <span className="hidden md:inline">Reset to Default Program</span>
    </Button>
  );
}
