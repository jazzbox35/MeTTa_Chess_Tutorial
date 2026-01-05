const citationMap: Record<string, number> = {};
let citationCounter = 1;

export interface ParsedLatex {
  title: string;
  order?: number;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
  readTime?: string;
  content: LatexContent[];
}

// Updated type to support proper nesting
export type LatexContent =
  | { type: "heading"; level: number; content: string }
  | { type: "paragraph"; content: string }
  | { type: "math"; content: string }
  | { type: "code"; language: string; content: string; cheatContent?: string; hideRun?: boolean }
  | { type: "list"; ordered: boolean; items: ListItem[] }
  | { type: "bibliography"; items: BibliographyItem[] }
  | { type: "pseudocode"; content: string };

export type NestedCode = {
  type: string;
  language: string;
  content: string;
};

export type NestedMath = {
  type: string;
  content: string;
};

export type BibliographyItem = {
  key: string;
  content: string;
  authors?: string;
  title?: string;
  venue?: string;
  year?: string;
};

export type ListItem = {
  content: string;
  nestedList?: LatexContent;
  nestedCode?: NestedCode;
  nestedMath?: NestedMath;
};

interface Metadata {
  description?: string;
  category?: string;
  order?: number;
  tags?: string[];
  date?: string;
}

export function parseLatex(latexContent: string): ParsedLatex {
  const title = extractTitle(latexContent) || "Untitled Tutorial";
  const metadata = extractMetadata(latexContent);
  const content = extractContent(latexContent);

  return {
    title,
    description: metadata.description,
    order: metadata.order,
    category: metadata.category,
    tags: metadata.tags,
    date: metadata.date,
    readTime: calculateReadTime(latexContent),
    content,
  };
}

function extractTitle(latexContent: string): string | null {
  const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
  return titleMatch ? titleMatch[1] : null;
}

function extractMetadata(latexContent: string): Metadata {
  const dateMatch = latexContent.match(/\\date\{([^}]+)\}/);
  const descriptionMatch = latexContent.match(
    /\\begin\{abstract\}([\s\S]*?)\\end\{abstract\}/
  );
  const orderMatch = latexContent.match(/\\order\{([^}]+)\}/);

  return {
    description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
    date: dateMatch ? dateMatch[1] : undefined,
    order: orderMatch ? Number.parseInt(orderMatch[1]) : undefined,
    tags: extractTags(latexContent),
    category: extractCategory(latexContent),
  };
}

function extractTags(latexContent: string): string[] {
  const tagsMatch = latexContent.match(/\\keywords\{([^}]+)\}/);
  return tagsMatch ? tagsMatch[1].split(",").map((tag) => tag.trim()) : [];
}

function extractCategory(latexContent: string): string | undefined {
  const categoryMatch = latexContent.match(/\\category\{([^}]+)\}/);
  return categoryMatch ? categoryMatch[1] : undefined;
}

function calculateReadTime(content: string): string {
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return `${minutes} min read`;
}

function extractContent(latexContent: string): LatexContent[] {
  const content: LatexContent[] = [];
  extractSections(latexContent, content);

  if (content.length === 0) {
    content.push({
      type: "paragraph",
      content: "No content could be extracted from this LaTeX document.",
    });
  }

  return content;
}

function extractSections(latexContent: string, content: LatexContent[]): void {
  const sectionRegex =
    /\\(section|subsection|subsubsection)\{([^}]+)\}([\s\S]*?)(?=\\(?:section|subsection|subsubsection)\{|\\end\{document\}|$)/g;
  let match;

  while ((match = sectionRegex.exec(latexContent)) !== null) {
    const sectionType = match[1];
    const sectionTitle = match[2];
    const sectionContent = match[3].trim();

    let level = 1;
    if (sectionType === "subsection") level = 2;
    else if (sectionType === "subsubsection") level = 3;

    content.push({
      type: "heading",
      level,
      content: sectionTitle,
    });

    processSectionContent(sectionContent, content);
  }

  if (content.length === 0) {
    const bodyMatch = latexContent.match(
      /\\begin\{document\}([\s\S]*?)\\end\{document\}/
    );
    if (bodyMatch) {
      processSectionContent(bodyMatch[1], content);
    }
  }
}

function processSectionContent(content: string, result: LatexContent[]): void {
  // Only extract and preserve code blocks to prevent splitting by empty lines
  const codeBlocks: { placeholder: string; content: string }[] = [];
  let processedContent = content;

  // Extract verbatim blocks
  processedContent = processedContent.replace(
    /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/g,
    (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ placeholder, content: match });
      return placeholder;
    }
  );

  // Extract lstlisting blocks
  processedContent = processedContent.replace(
    /\\begin\{lstlisting\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{lstlisting\}/g,
    (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ placeholder, content: match });
      return placeholder;
    }
  );

  // Extract minted blocks
  processedContent = processedContent.replace(
    /\\begin\{minted\}\{([^}]*)\}([\s\S]*?)\\end\{minted\}/g,
    (match) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ placeholder, content: match });
      return placeholder;
    }
  );

  // Split by paragraphs (double newlines)
  const paragraphs = processedContent.split(/\n\s*\n/);

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // Check if this paragraph is a code block placeholder
    const codeBlockMatch = trimmedParagraph.match(/^__CODE_BLOCK_(\d+)__$/);
    if (codeBlockMatch) {
      const blockIndex = parseInt(codeBlockMatch[1]);
      const codeBlock = codeBlocks[blockIndex];
      if (codeBlock) {
        extractCodeContent(codeBlock.content, result);
      }
      continue;
    }

    // Handle lists - pass the codeBlocks for resolving placeholders
    if (
      trimmedParagraph.startsWith("\\begin{itemize}") ||
      trimmedParagraph.startsWith("\\begin{enumerate}")
    ) {
      extractListContent(trimmedParagraph, result, codeBlocks);
      continue;
    }

    if (trimmedParagraph.startsWith("\\begin{algpseudocode}")) {
      extractPseudocodeContent(content, result);
      continue;
    }

    // Handle bibliography normally
    if (trimmedParagraph.startsWith("\\begin{thebibliography}")) {
      let bibBlock = trimmedParagraph;
      let foundEnd = trimmedParagraph.includes("\\end{thebibliography}");
      let pIndex = paragraphs.indexOf(paragraph);

      while (!foundEnd && pIndex + 1 < paragraphs.length) {
        pIndex++;
        bibBlock += "\n\n" + paragraphs[pIndex].trim();
        if (paragraphs[pIndex].includes("\\end{thebibliography}")) {
          foundEnd = true;
        }
      }

      extractBibliographyContent(bibBlock, result);

      for (
        let skip = paragraphs.indexOf(paragraph) + 1;
        skip <= pIndex;
        skip++
      ) {
        paragraphs[skip] = "";
        ``;
      }
      continue;
    }

    // Regular paragraph - clean any remaining placeholders
    let cleanedParagraph = trimmedParagraph;
    cleanedParagraph = cleanedParagraph.replace(/__[A-Z_]+_\d+__/g, "").trim();

    if (cleanedParagraph) {
      result.push({
        type: "paragraph",
        content: cleanLatexText(cleanedParagraph),
      });
    }
  }
}

function extractCodeContent(content: string, result: LatexContent[]): void {
  let codeContent = "";
  let language = "text";
  let cheatContent = "";
  let hideRun = false;

  if (content.includes("\\begin{verbatim}")) {
    const match = content.match(
      /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/
    );
    if (match) {
      codeContent = match[1].replace(/^\n+|\n+$/g, "");
    }
  } else if (content.includes("\\begin{lstlisting}")) {
    const match = content.match(
      /\\begin\{lstlisting\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{lstlisting\}/
    );
    if (match) {
      codeContent = match[2].replace(/^\n+|\n+$/g, "");
      const languageMatch = match[1]?.match(/language=(\w+)/);
      if (languageMatch) language = languageMatch[1];
    }
  } else if (content.includes("\\begin{minted}")) {
    const match = content.match(
      /\\begin\{minted\}\{([^}]*)\}([\s\S]*?)\\end\{minted\}/
    );
    if (match) {
      language = match[1];
      codeContent = match[2].replace(/^\n+|\n+$/g, "");
    }
  }

  if (codeContent) {
    const lines = codeContent.split("\n");
    const codeLines: string[] = [];
    for (const line of lines) {
      const cheatMatch = line.match(/^(?:;;|\/\/|#)\s*cheat:\s*(.*)$/i);
      if (cheatMatch) {
        cheatContent = cheatContent
          ? `${cheatContent}\n${cheatMatch[1]}`
          : cheatMatch[1];
        continue;
      }
      if (line.toUpperCase().includes("HIDE-RUN")) {
        hideRun = true;
        continue;
      }
      codeLines.push(line);
    }

    result.push({
      type: "code",
      language,
      content: codeLines.join("\n"),
      cheatContent: cheatContent || undefined,
      hideRun: hideRun || undefined,
    });
  }
}

function extractNestedCodeContent(content: string): NestedCode | null {
  let codeContent = "";
  let language = "text";

  if (content.includes("\\begin{verbatim}")) {
    const match = content.match(
      /\\begin\{verbatim\}([\s\S]*?)\\end\{verbatim\}/
    );
    if (match) {
      codeContent = match[1].replace(/^\n+|\n+$/g, "");
    }
  } else if (content.includes("\\begin{lstlisting}")) {
    const match = content.match(
      /\\begin\{lstlisting\}(?:\[([^\]]*)\])?([\s\S]*?)\\end\{lstlisting\}/
    );
    if (match) {
      codeContent = match[2].replace(/^\n+|\n+$/g, "");
      const languageMatch = match[1]?.match(/language=(\w+)/);
      if (languageMatch) language = languageMatch[1];
    }
  } else if (content.includes("\\begin{minted}")) {
    const match = content.match(
      /\\begin\{minted\}\{([^}]*)\}([\s\S]*?)\\end\{minted\}/
    );
    if (match) {
      language = match[1];
      codeContent = match[2].replace(/^\n+|\n+$/g, "");
    }
  }

  if (codeContent) {
    return {
      type: "code",
      language,
      content: codeContent,
    };
  }

  return null;
}

// FIXED: Enhanced extractListContent function with proper placeholder resolution
function extractListContent(
  content: string,
  result: LatexContent[],
  codeBlocks: { placeholder: string; content: string }[] = []
): void {
  const isOrdered = content.includes("\\begin{enumerate}");
  const items: ListItem[] = [];

  // Split content into lines for better parsing
  const lines = content.split("\n");
  let i = 0;

  // Skip the \begin{...} line
  while (i < lines.length && !lines[i].trim().startsWith("\\item")) {
    i++;
  }

  while (i < lines.length) {
    const line = lines[i].trim();

    // Check for list end
    if (line.includes("\\end{enumerate}") || line.includes("\\end{itemize}")) {
      break;
    }

    // Check for new item
    if (line.startsWith("\\item ")) {
      // Extract item content after \item
      let itemContent = line.substring(6).trim(); // Remove '\item '
      let j = i + 1;
      let nestedCode: NestedCode | undefined;
      let nestedList: LatexContent | undefined;

      // Look ahead to collect all content for this item until next \item or end
      const itemLines: string[] = [itemContent];

      while (j < lines.length) {
        const nextLine = lines[j].trim();

        // Stop if we hit the end of the current list or a new item
        if (
          nextLine.includes("\\end{enumerate}") ||
          nextLine.includes("\\end{itemize}") ||
          nextLine.startsWith("\\item ")
        ) {
          break;
        }

        // Check for nested list
        if (
          nextLine.includes("\\begin{itemize}") ||
          nextLine.includes("\\begin{enumerate}")
        ) {
          // Find the end of the nested list
          let nestedContent = "";
          let nestedLevel = 0;

          while (j < lines.length) {
            const nestedLine = lines[j];
            nestedContent += nestedLine + "\n";

            if (
              nestedLine.includes("\\begin{itemize}") ||
              nestedLine.includes("\\begin{enumerate}")
            ) {
              nestedLevel++;
            }
            if (
              nestedLine.includes("\\end{itemize}") ||
              nestedLine.includes("\\end{enumerate}")
            ) {
              nestedLevel--;
              if (nestedLevel === 0) {
                j++;
                break;
              }
            }
            j++;
          }

          // Parse the nested list
          const nestedResult: LatexContent[] = [];
          extractListContent(nestedContent.trim(), nestedResult, codeBlocks);
          if (nestedResult.length > 0) {
            nestedList = nestedResult[0];
          }
          break;
        }
        // Check for code block placeholders in the collected content
        else if (nextLine.match(/^__CODE_BLOCK_\d+__$/)) {
          const placeholderMatch = nextLine.match(/^__CODE_BLOCK_(\d+)__$/);
          if (placeholderMatch && codeBlocks) {
            const blockIndex = parseInt(placeholderMatch[1]);
            const codeBlock = codeBlocks[blockIndex];
            if (codeBlock) {
              nestedCode =
                extractNestedCodeContent(codeBlock.content) ?? undefined;
            }
          }
          j++;
        }
        // Check for direct code blocks
        else if (
          nextLine.includes("\\begin{verbatim}") ||
          nextLine.includes("\\begin{lstlisting}") ||
          nextLine.includes("\\begin{minted}")
        ) {
          // Find the end of the code block
          let codeContent = "";
          let endPattern = "";

          if (nextLine.includes("\\begin{verbatim}")) {
            endPattern = "\\end{verbatim}";
          } else if (nextLine.includes("\\begin{lstlisting}")) {
            endPattern = "\\end{lstlisting}";
          } else if (nextLine.includes("\\begin{minted}")) {
            endPattern = "\\end{minted}";
          }

          while (j < lines.length) {
            const codeLine = lines[j];
            codeContent += codeLine + "\n";

            if (codeLine.includes(endPattern)) {
              j++;
              break;
            }
            j++;
          }

          nestedCode =
            extractNestedCodeContent(codeContent.trim()) ?? undefined;
          break;
        } else {
          // Add this line to the current item content
          if (nextLine) {
            itemLines.push(nextLine);
          }
          j++;
        }
      }

      // Clean and combine item content, resolving any remaining placeholders
      let finalItemContent = itemLines.join(" ").trim();

      // Resolve any remaining code block placeholders in the text
      if (codeBlocks && codeBlocks.length > 0) {
        finalItemContent = finalItemContent.replace(
          /__CODE_BLOCK_(\d+)__/g,
          (match, index) => {
            const blockIndex = parseInt(index);
            if (codeBlocks[blockIndex]) {
              // If we find a placeholder but don't have nested code yet, extract it
              if (!nestedCode) {
                nestedCode =
                  extractNestedCodeContent(codeBlocks[blockIndex].content) ??
                  undefined;
              }
              return ""; // Remove the placeholder from text
            }
            return match;
          }
        );
      }

      // Create the list item
      const listItem: ListItem = {
        content: cleanLatexText(finalItemContent),
      };

      if (nestedCode) {
        listItem.nestedCode = nestedCode;
      }

      if (nestedList) {
        listItem.nestedList = nestedList;
      }

      items.push(listItem);

      // Move to the next unprocessed line
      i = j - 1;
    }

    i++;
  }

  if (items.length > 0) {
    result.push({
      type: "list",
      ordered: isOrdered,
      items: items,
    });
  }
}

function extractBibliographyContent(
  content: string,
  result: LatexContent[]
): void {
  const items: BibliographyItem[] = [];

  const bibMatch = content.match(
    /\\begin\{thebibliography\}\{[^}]*\}([\s\S]*?)\\end\{thebibliography\}/
  );
  if (!bibMatch) return;

  const bibContent = bibMatch[1];
  const bibItemRegex = /\\bibitem\{([^}]+)\}([\s\S]*?)(?=\\bibitem\{|$)/g;
  let match;

  while ((match = bibItemRegex.exec(bibContent)) !== null) {
    const key = match[1];
    const rawContent = match[2].trim();

    if (!key || !rawContent) continue;

    const cleanedContent = cleanLatexText(rawContent);
    const parsedItem = parseBibliographyItem(key, cleanedContent);
    items.push(parsedItem);
  }

  if (items.length > 0) {
    result.push({
      type: "bibliography",
      items: items,
    });
  }
}

function parseBibliographyItem(key: string, content: string): BibliographyItem {
  let authors = "";
  let title = "";
  let venue = "";
  let year = "";

  const yearMatch = content.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = yearMatch[0];
  }

  const titleMatch = content.match(/``([^']+)''|"([^"]+)"|<em>([^<]+)<\/em>/);
  if (titleMatch) {
    title = titleMatch[1] || titleMatch[2] || titleMatch[3] || "";
  }

  const parts = content.split(/,|\.|``|"/);
  if (parts.length > 0) {
    authors = parts[0].trim();
  }

  const venueMatch = content.match(/in\s+<em>([^<]+)<\/em>|<em>([^<]+)<\/em>/);
  if (venueMatch) {
    venue = venueMatch[1] || venueMatch[2] || "";
  }

  return {
    key,
    content,
    authors: authors || undefined,
    title: title || undefined,
    venue: venue || undefined,
    year: year || undefined,
  };
}

export function extractPseudocodeContent(
  content: string,
  result: LatexContent[]
): void {
  const pseudocodeRegex =
    /\\begin\{algpseudocode\}([\s\S]*?)\\end\{algpseudocode\}/g;
  let match;

  while ((match = pseudocodeRegex.exec(content)) !== null) {
    const pseudocodeContent = match[1].trim();

    if (pseudocodeContent) {
      result.push({
        type: "pseudocode",
        content: pseudocodeContent,
      });
    }
  }
}

function cleanLatexText(text: string): string {
  const cleaned = text
    .replace(/\\textbf\{([^}]+)\}/g, "<strong>$1</strong>")
    .replace(/\\paragraph\{([^}]+)\}/g, "<strong>$1</strong>")
    .replace(/\\space\{([^}]+)\}/g, "<span class='w-20'></span>")
    .replace(
      /\\texttt\{([^}]+)\}/g,
      "<code class='bg-gray-100 px-1 py-0.5 rounded text-sm'>$1</code>"
    )
    .replace(
      /\\verb(.)(.*?)\1/g,
      "<code class='bg-gray-100 px-1 py-0.5 rounded text-sm'>$2</code>"
    )
    .replace(/\\emph\{([^}]+)\}/g, "<em>$1</em>")
    .replace(/\\underline\{([^}]+)\}/g, "<u>$1</u>")
    .replace(/\\ref\{([^}]+)\}/g, "[Ref: $1]")
    .replace(/\\url\{([^}]+)\}/g, "<a href='$1'>$1</a>")
    .replace(/\\href\{([^}]+)\}\{([^}]+)\}/g, "<a href='$1'>$2</a>")
    .replace(/\\footnote\{([^}]+)\}/g, "")
    .replace(/\\\\/, "<br>")
    .replace(/~/g, " ")
    .replace(/\\%/g, "%")
    .replace(/\\&/g, "&")
    .replace(/\\_/g, "_")
    .replace(/\\#/g, "#")
    .replace(/\\{/g, "{")
    .replace(/\\}/g, "}")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\\cite\{([^}]+)\}/g, (_match, key) => {
      if (!citationMap[key]) {
        citationMap[key] = citationCounter++;
      }
      const number = citationMap[key];
      return `<a href="further-explorations#reference" class="text-blue-600 underline cursor-pointer">[${number}]</a>`;
    });

  return cleaned.trim();
}
