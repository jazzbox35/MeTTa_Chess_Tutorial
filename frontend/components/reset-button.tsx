"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/lib/constants";

export function ResetButton() {
  const handleReset = async () => {
    try {
      const response = await fetch(`${FRONTEND_BASE_URL}/stop`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Stop API returned ${response.status}`);
      }
      alert("Backend stop request sent.");
    } catch (error) {
      console.error("Failed to stop backend:", error);
      alert("Failed to send stop request.");
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleReset}>
      {/* Icon for small screens (hidden on md and up) */}
      <RefreshCcw className="h-4 w-4 md:hidden" />

      {/* Text for medium screens and up */}
      <span className="hidden md:inline">Reset AtomSpace</span>
    </Button>
  );
}
