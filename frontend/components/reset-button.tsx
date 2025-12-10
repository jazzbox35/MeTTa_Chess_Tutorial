"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";

export function ResetButton() {
  const handleReset = async () => {
    try {
      const response = await fetch("http://localhost:5000/reset-atomspace", {
        method: "POST",
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("Failed to reset AtomSpace:", error);
      alert("Failed to reset AtomSpace.");
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