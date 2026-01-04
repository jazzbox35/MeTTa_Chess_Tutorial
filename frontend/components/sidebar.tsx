"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { TutorialList } from "./tutorial-list"
import { Tutorial } from "@/lib/tutorials"

interface SidebarWithTutorialsProps {
  allTutorials: Tutorial[]
}

export function SidebarWithTutorials({ allTutorials }: SidebarWithTutorialsProps) {
  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden mt-10">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 rounded-md border flex items-center gap-2">
              <Menu className="w-5 h-5" />
              <span className="text-sm font-medium">Contents</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4 border-none">
            <SheetHeader>
              <SheetTitle></SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <TutorialList tutorials={allTutorials} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <div className="sticky top-24 h-[calc(100vh-6rem)]">
          <div className="text-sm font-semibold mb-2 text-foreground">All Contents</div>
          <TutorialList tutorials={allTutorials} />
        </div>
      </div>
    </>
  )
}
