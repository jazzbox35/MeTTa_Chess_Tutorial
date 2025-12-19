"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResetButton } from "./reset-button";
import { DisplayAtomspaceButton } from "./display-atomspace-button";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  // Show header actions on all sections/pages
  const showResetButton = true;

  return (
    <header className="fixed top-0 z-40 w-full border-b bg-background pr-5">
      <div className="flex h-16 items-center space-x-4 sm:justify-between sm:space-x-6">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <BookOpen className="hidden md:inline h-6 w-6" />
            <span className="md:hidden font-bold">MeTTa Chess Tutorial</span>
            <span className="hidden md:inline-block font-bold">MeTTa Chess Tutorial</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center space-x-4 sm:justify-end">
          <div className="flex-1 max-w-3xl mx-auto sm:mx-1">
            <SearchBar />
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="outline" size="sm" className="text-xs px-3 h-9 min-w-[140px]">
              Play Chess
            </Button>
            <div className="min-w-[140px] h-9">
              <ResetButton />
            </div>
            <div className="min-w-[140px] h-9">
              <DisplayAtomspaceButton />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs px-3 h-9 min-w-[140px]"
              onClick={() => {
                ;(globalThis as any).Atomspace_state = ""
                try {
                  window.localStorage.setItem("Atomspace_state", "")
                } catch {
                  // ignore storage errors
                }
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("atomspace_state_updated", { detail: "" }))
                }
                alert("Atomspace successfully reset.")
              }}
            >
              Reset Atomspace
            </Button>
          </div>
          <div className="mx-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header> 
  );
}
