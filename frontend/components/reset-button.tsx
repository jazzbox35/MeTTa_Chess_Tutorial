"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/lib/constants";

export function ResetButton() {
  const handleReset = async () => {
    try {
      const response = await fetch(`${FRONTEND_BASE_URL}/metta`, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        // Mirror the curl example payload
        body: "!(+ 1 2)",
      });
      if (!response.ok) {
        throw new Error(`Metta API returned ${response.status}`);
      }
      // Display the backend response (e.g., [3])
      const text = await response.text();
      alert(text || "No response body");
    } catch (error) {
      console.error("Failed to call Metta backend:", error);
      alert("Failed to call Metta backend.");
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
