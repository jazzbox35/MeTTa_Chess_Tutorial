/**
 * Split a bracketed list of parenthesized items into separate lines.
 * Example input: `[ (data...), (data2...), (data3...) ]`
 * Output string:
 *   (data...)
 *   (data2...)
 *   (data3...)
 */
export function splitParenthesizedArray(raw: string): string {
  let body = raw.trim()
  if (body.startsWith("[")) body = body.slice(1)
  if (body.endsWith("]")) body = body.slice(0, -1)

  const items: string[] = []
  let current = ""
  let depth = 0

  for (let i = 0; i < body.length; i++) {
    const ch = body[i]

    if (ch === "(") depth++
    if (ch === ")") depth--

    current += ch

    // When a top-level group closes, capture it and skip separators
    if (depth === 0 && ch === ")") {
      items.push(current.trim())
      current = ""

      // Skip commas/whitespace between items
      while (i + 1 < body.length && (body[i + 1] === "," || /\s/.test(body[i + 1]))) {
        i++
      }
    }
  }

  if (depth !== 0) {
    throw new Error("Unbalanced parentheses in input")
  }

  return items.join("\n")
}
