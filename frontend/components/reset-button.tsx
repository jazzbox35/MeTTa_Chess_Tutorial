"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/lib/constants";

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
        } catch {
          // ignore storage errors
        }
        window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: program }))
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
