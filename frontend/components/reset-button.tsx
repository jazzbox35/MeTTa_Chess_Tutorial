"use client";

import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import { FRONTEND_BASE_URL } from "@/lib/constants";

export function ResetButton() {
  const handleReset = async () => {
    alert("Now running default MeTTa chess program.");
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
