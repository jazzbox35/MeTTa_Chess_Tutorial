"use client";

import { useEffect, useRef } from "react";
import type { JSX } from "react/jsx-runtime";
import { MathFormula } from "@/components/math-formula";
import { useSearchParams } from "next/navigation";
import { CodeEditor } from "@/components/code-editor";
import type {
  BibliographyItem,
  LatexContent,
  ListItem,
} from "@/lib/latex-parser";
import { PseudocodeRenderer } from "./pseudocode-renderer";

interface LatexRendererProps {
  content: LatexContent[];
  pageSlug?: string;
}


let globalCodeId = 1; 

export function LatexRenderer({ content, pageSlug }: LatexRendererProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const shouldResetWithGreedy = pageSlug === "create-chess-game";

  // Initialize MathJax for the entire content
  useEffect(() => {
    if (contentRef.current && typeof window !== "undefined" && window.MathJax) {
      window.MathJax.typesetPromise([contentRef.current]).catch((err) => {
        console.error("MathJax typesetting failed:", err);
      });
    }
  }, [content]);

  // Scroll to the section if hash is present
  useEffect(() => {
    const hash = window.location.hash.substring(1);

    if (hash && contentRef.current) {
      const element = document.getElementById(hash);

      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
          element.classList.add("search-highlight");
          setTimeout(() => {
            element.classList.remove("search-highlight");
          }, 3000);
        }, 300);
      }
    }
  }, [searchParams]);

  // Helper function to escape dollar signs in text content
  const escapeText = (text: string): string => {
    return text.replace(/\$/g, "&#36;");
  };

  // Enhanced helper to render list items with proper nesting including code and math
  const renderListItem = (item: ListItem, index: number): JSX.Element => {
    return (
      <li key={index} className="my-2 leading-relaxed">
        {/* Main item content */}
        {item.content && (
          <span
            className="mb-2"
            dangerouslySetInnerHTML={{ __html: escapeText(item.content) }}
          />
        )}

        {/* Nested list content */}
        {item.nestedList && (
          <div className="mt-3 ml-2">
            {renderContent(item.nestedList, index)}
          </div>
        )}

        {/* Nested code content */}
        {item.nestedCode && (
          <div className="mt-3">
            <CodeEditor
              code={item.nestedCode.content || ""}
              language={item.nestedCode.language || "text"}
              readOnly={true}
              showLineNumbers={false}
              codeId={globalCodeId++}
              resetWithGreedyBeforeRun={shouldResetWithGreedy}
            />
          </div>
        )}

        {/* Nested math content */}
        {item.nestedMath && (
          <div className="mt-3">
            <MathFormula
              formula={item.nestedMath.content || ""}
              display={true}
              className="my-0"
            />
          </div>
        )}
      </li>
    );
  };

  // Update the renderContent function to handle the new structure
  const renderContent = (
    item: LatexContent,
    index: number
  ): JSX.Element | null => {
    switch (item.type) {
      case "heading":
        const HeadingTag = `h${item.level}` as keyof JSX.IntrinsicElements;
        const headingId = item.content
          ?.toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");

        return (
          <HeadingTag
            key={index}
            id={headingId}
            className={`font-bold ${
              item.level === 1
                ? "text-3xl mt-8 mb-4"
                : item.level === 2
                ? "text-2xl mt-8 mb-4"
                : "text-xl mt-6 mb-3"
            }`}
          >
            {escapeText(item?.content ?? "")}
          </HeadingTag>
        );

      case "paragraph":
        return (
          <p
            key={index}
            className="my-4 leading-relaxed"
            dangerouslySetInnerHTML={{
              __html: escapeText(item?.content ?? ""),
            }}
          />
        );

      case "bibliography":
        return <BibliographyRenderer key={index} items={item.items} />;

      case "math":
        return (
          <MathFormula
            key={index}
            formula={item?.content ?? ""}
            display={true}
            className="my-4"
          />
        );

      case "code":
        const codeId = globalCodeId++; // assign unique ID
        return (
          <div key={index}>
            <CodeEditor
              code={item?.content ?? ""}
              language={item.language || "text"}
              codeId={codeId}
              cheatContent={item.cheatContent}
              hideRun={item.hideRun}
              readOnly={item.hideRun}
              resetWithGreedyBeforeRun={shouldResetWithGreedy}
            />
          </div>
        );
      case "pseudocode":
        return (
          <div key={index}>
            <PseudocodeRenderer code={item?.content ?? ""} />
          </div>
        );

      case "list":
        const ListTag = item.ordered ? "ol" : "ul";
        const listClasses = item.ordered
          ? "my-4 list-decimal pl-6 space-y-1"
          : "my-4 list-disc pl-6 space-y-1";

        return (
          <ListTag key={index} className={listClasses}>
            {item.items?.map((listItem, i) => renderListItem(listItem, i))}
          </ListTag>
        );

      default:
        return null;
    }
  };

  return (
    <div
      ref={contentRef}
      className="tutorial-content prose prose-slate max-w-none dark:prose-invert"
    >
      <style>{`
        /* Ensure proper nesting styles for lists */
        .tutorial-content ol {
          counter-reset: item;
        }

        .tutorial-content ol > li {
          display: block;
          margin-bottom: 0.75rem;
        }

        .tutorial-content ol > li:before {
          content: counters(item, ".") ". ";
          counter-increment: item;
          font-weight: bold;
          color: inherit;
        }

        /* Nested unordered lists should use different bullet styles */
        .tutorial-content ul ul {
          list-style-type: circle;
          margin-top: 0.5rem;
        }

        .tutorial-content ul ul ul {
          list-style-type: square;
        }

        /* Nested ordered lists should use different numbering */
        .tutorial-content ol ol {
          list-style-type: lower-alpha;
          margin-top: 0.5rem;
        }

        .tutorial-content ol ol ol {
          list-style-type: lower-roman;
        }

        /* Reset counters for nested lists */
        .tutorial-content ol ol {
          counter-reset: item;
        }

        /* Improve readability of nested content */
        .tutorial-content li > div {
          line-height: 1.6;
        }

        /* Add subtle borders for nested content */
        .tutorial-content li > div:has(.code-editor) {
          border-left: 3px solid #e5e7eb;
          padding-left: 1rem;
        }
      `}</style>
      {content.map(renderContent)}
    </div>
  );
}

interface BibliographyProps {
  items: BibliographyItem[];
}

export function BibliographyRenderer({ items }: BibliographyProps) {
  return (
    <div className="bibliography-section mt-8">
      <h2 className="text-2xl font-bold mb-4" id="reference">
        References
      </h2>
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.key} className="bibliography-item">
            <div className="flex gap-3">
              <span className="text-sm text-gray-500 font-mono min-w-[3rem]">
                [{index + 1}]
              </span>
              <div className="flex-1">
                <div
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
                {(item.authors || item.title || item.venue || item.year) && (
                  <div className="mt-2 text-xs text-gray-600 space-y-1">
                    {item.authors && (
                      <div>
                        <strong>Authors:</strong> {item.authors}
                      </div>  
                    )}
                    {item.title && (
                      <div>
                        <strong>Title:</strong> {item.title}
                      </div>
                    )}
                    {item.venue && (
                      <div>
                        <strong>Venue:</strong> {item.venue}
                      </div>
                    )}
                    {item.year && (
                      <div>
                        <strong>Year:</strong> {item.year}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
