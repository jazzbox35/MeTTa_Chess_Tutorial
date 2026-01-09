// app/tutorials/[slug]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ChevronLeft, ChevronRight, Clock, FileText, Tag } from "lucide-react"
import { LatexRenderer } from "@/components/latex-renderer"
import { TableOfContents } from "@/components/table-of-contents"
import { getAllTutorials, getTutorialBySlug } from "@/lib/tutorials"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarWithTutorials } from "@/components/sidebar"
import { UploadAtomspaceButton } from "@/components/upload-atomspace-button"

type Params = {
  params: {
    slug: string;
  };
};

export default async function TutorialPage({ params }: Params) {
  try {
    const { slug } = await params;
    const tutorial = await getTutorialBySlug(slug)
    const allTutorials = await getAllTutorials()
    console.log(`all tutorial number ${allTutorials.length}`)

    if (!tutorial) notFound()

    const currentIndex = allTutorials.findIndex((t) => t.slug === slug)
    const prevTutorial = currentIndex > 0 ? allTutorials[currentIndex - 1] : null
    const nextTutorial = currentIndex < allTutorials.length - 1 ? allTutorials[currentIndex + 1] : null
    const normalizedTitle = tutorial.title.trim().toLowerCase()
    const showGreedyDownload =
      tutorial.slug === "your-first-code" || normalizedTitle === "your turn to improve the game"
    let skippedTitleHeading = false
    const filteredContent = tutorial.content.filter((item) => {
      if (
        item.type === "heading" &&
        item.content &&
        item.content.trim().toLowerCase() === normalizedTitle &&
        !skippedTitleHeading
      ) {
        skippedTitleHeading = true
        return false
      }
      return true
    })

    return (
      <div className=" py-8">

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_212px] gap-6">
          
       <SidebarWithTutorials allTutorials={allTutorials}/>
          {/* Main Content - Always visible, adjusts width based on screen size */}
          <div className="min-w-0"> {/* min-w-0 prevents flex child from overflowing */}
            
            {/* Back to tutorials link */}
            <Link href="/tutorials" className="text-sm flex items-center text-muted-foreground hover:text-foreground mb-4">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to tutorials
            </Link>

            {/* Tutorial Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">{tutorial.title}</h1>
              <p className="text-muted-foreground mt-2">{tutorial.description}</p>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <Badge variant="outline">{tutorial.category}</Badge>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {tutorial.readTime}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-1" />
                  {tutorial.date}
                </div>
              </div>

              {tutorial.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="flex items-center text-sm text-muted-foreground mr-2">
                    <Tag className="h-4 w-4 mr-1" />
                    Tags:
                  </div>
                  {tutorial.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

            </div>


            <Separator className="my-6" />
            
            {/* Tutorial Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <LatexRenderer content={filteredContent} pageSlug={slug} />
            </div>

            {showGreedyDownload && (
              <div className="mt-6 flex gap-2">
                <Button variant="outline" asChild className="text-sm">
                  <a href="/api/greedy-metta">Download greedy.metta</a>
                </Button>
                <UploadAtomspaceButton />
              </div>
            )}

            {/* Navigation: Previous/Next */}
            <div className="mt-12 pt-6 border-t">
              <div className="flex flex-col sm:flex-row gap-4">
                {prevTutorial ? (
                  <Link href={`/tutorials/${prevTutorial.slug}`} className="flex-1">
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-start">
                      <ChevronLeft className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{prevTutorial.title}</span>
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1">
                    <Button variant="outline" className="w-full" disabled>
                      <ChevronLeft className="h-4 w-4 mr-2" />
                      Previous Tutorial
                    </Button>
                  </div>
                )}

                {nextTutorial ? (
                  <Link href={`/tutorials/${nextTutorial.slug}`} className="flex-1">
                    <Button variant="outline" className="flex items-center gap-2 w-full justify-end">
                      <span className="truncate">{nextTutorial.title}</span>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                    </Button>
                  </Link>
                ) : (
                  <div className="flex-1">
                    <Button variant="outline" className="w-full" disabled>
                      Next Tutorial
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Table of Contents - Only visible on xl+ screens */}
          <div className="hidden xl:block">
            <div className="sticky top-32 h-[calc(100vh-8rem)] pt-2">
              <Card className="p-4">
                <h3 className="text-lg font-semibold mb-3 text-foreground">On This Page</h3>
                <ScrollArea className="h-[calc(100vh-16rem)] pr-4">
                  <TableOfContents content={filteredContent} />
                </ScrollArea>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    const { slug } = params
    console.error(`Error loading tutorial ${slug}:`, error)
    notFound()
  }
}
