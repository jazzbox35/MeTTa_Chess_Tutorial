import fs from "fs/promises"
import path from "path"
import { parseLatex, ParsedLatex, LatexContent } from "./latex-parser"

// Define the tutorial interface based on the parsed LaTeX content
export interface Tutorial {
  slug: string
  title: string
  order?:number
  description: string
  category: string
  tags: string[]
  date: string
  readTime: string
  content: LatexContent[]
  filePath: string
}

// Path to the tutorials directory
const tutorialsDirectory = path.join(process.cwd(), "tutorials")

// Get all tutorial slugs
export async function getAllTutorialSlugs(): Promise<string[]> {
  try {
    // Check if directory exists first
    try {
      await fs.access(tutorialsDirectory)
    } catch  {
      // Directory doesn't exist, create it
      await fs.mkdir(tutorialsDirectory, { recursive: true })
      return []
    }

    const files = await fs.readdir(tutorialsDirectory)
    return files
      .filter((file) => file.endsWith(".tex"))
      .map((file) => file.replace(/\.tex$/, ""))
  } catch (error) {
    console.error("Error reading tutorial directory:", error)
    return []
  }
}

// Get tutorial data by slug
export async function getTutorialBySlug(slug: string): Promise<Tutorial | null> {
  try {
    const filePath = path.join(tutorialsDirectory, `${slug}.tex`)
    const fileContent = await fs.readFile(filePath, "utf8")

    // Parse the LaTeX content with proper typing
    const parsedContent: ParsedLatex = parseLatex(fileContent)
    

    return {
      slug,
      title: parsedContent.title || slug,
      order:parsedContent.order  ,
      description: parsedContent.description || `A tutorial on chess search`,
      category: parsedContent.category || "Uncategorized",
      tags: parsedContent.tags || [],
      date: parsedContent.date || new Date().toLocaleDateString(),
      readTime: parsedContent.readTime || "10 min read",
      content: parsedContent.content,
      filePath,
    }
  } catch (error) {
    console.error(`Error reading tutorial ${slug}:`, error)

    // Handle file not found error
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null
    }

    // For development purposes, return a dummy tutorial
    return getDummyTutorial(slug)
  }
}

// Get all tutorials with proper type filtering
export async function getAllTutorials(): Promise<Tutorial[]> {
  const slugs = await getAllTutorialSlugs()
  const tutorials = await Promise.all(
    slugs.map(async (slug) => await getTutorialBySlug(slug))
  )

// Filter out null values and sort by order (then by date as fallback)
  return tutorials
    .filter((tutorial): tutorial is Tutorial => tutorial !== null)
    .sort((a, b) => {
      // Get order values (default to Infinity if undefined, so they appear last)
      const orderA = a.order ?? Infinity;
      const orderB = b.order ?? Infinity;
      
      // First sort by order
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // If orders are equal (or both undefined), sort by date (newest first)
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
}



// Strongly typed dummy tutorial data
function getDummyTutorial(slug: string): Tutorial {
  const dummyTutorials: Record<string, Tutorial> = {
    "intro-graph-algorithms": {
      slug: "intro-graph-algorithms",
      title: "Introduction to Graph Algorithms",
      description: "Learn the fundamentals of graph theory and common algorithms.",
      category: "Algorithms",
      tags: ["Graphs", "BFS", "DFS"],
      date: "May 15, 2023",
      readTime: "15 min read",
      filePath: path.join(tutorialsDirectory, "intro-graph-algorithms.tex"),
      content: [
        {
          type: "heading",
          level: 1,
          content: "Introduction to Graph Algorithms",
        },
        {
          type: "paragraph",
          content: "Graphs are mathematical structures used to model pairwise relations between objects.",
        },
        // ... rest of the content
      ] as LatexContent[],
    },
    "intro-metta-programming": {
      slug: "intro-metta-programming",
      title: "Introduction to meTTa Programming",
      description: "Learn the basics of meTTa programming language and its applications.",
      category: "Programming",
      tags: ["meTTa", "Logic Programming"],
      date: "August 5, 2023",
      readTime: "12 min read",
      filePath: path.join(tutorialsDirectory, "intro-metta-programming.tex"),
      content: [
        {
          type: "heading",
          level: 1,
          content: "Introduction to meTTa Programming",
        },
        {
          type: "paragraph",
          content: "meTTa is a modern programming language designed for knowledge representation.",
        },
        // ... rest of the content
      ] as LatexContent[],
    },
  }

  return (
    dummyTutorials[slug] || {
      slug,
      title: `Tutorial: ${slug}`,
      description: `A tutorial about ${slug}`,
      category: "Uncategorized",
      tags: ["Tutorial"],
      date: new Date().toLocaleDateString(),
      readTime: "10 min read",
      filePath: path.join(tutorialsDirectory, `${slug}.tex`),
      content: [
        {
          type: "heading",
          level: 1,
          content: `Tutorial: ${slug}`,
        },
        {
          type: "paragraph",
          content: "This is a placeholder tutorial content.",
        },
      ] as LatexContent[],
    }
  )
}
