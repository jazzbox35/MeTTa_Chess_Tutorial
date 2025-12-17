"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResetButton } from "./reset-button";

export function SiteHeader() {
  const pathname = usePathname();
  const isTutorialPath = pathname.startsWith("/tutorials");

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
          {isTutorialPath && (
            <div>
              <ResetButton />
            </div>
          )}
          <div className="mx-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header> 
  );
}
