import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Play Chess",
}

export default function ChessPage() {
  const pieces = {
    r: "♜",
    n: "♞",
    b: "♝",
    q: "♛",
    k: "♚",
    p: "♟︎",
  }

  const setup = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["r", "n", "b", "q", "k", "b", "n", "r"],
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
      <div className="bg-slate-800 p-4 rounded-xl shadow-2xl shadow-black/50">
        <div className="grid grid-cols-8 border-4 border-slate-700 rounded-lg overflow-hidden">
          {setup.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const isDark = (rowIdx + colIdx) % 2 === 0
              const isGoldSide = rowIdx < 2
              const isSilverSide = rowIdx > 5
              const colorClass = isGoldSide
                ? "text-amber-300 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                : isSilverSide
                  ? "text-slate-200 drop-shadow-[0_0_6px_rgba(226,232,240,0.8)]"
                  : "text-slate-100"

              return (
                <div
                  key={`${rowIdx}-${colIdx}`}
                  className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center text-2xl sm:text-3xl ${
                    isDark ? "bg-slate-700" : "bg-slate-600"
                  }`}
                >
                  <span className={colorClass}>{cell ? pieces[cell as keyof typeof pieces] : ""}</span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
