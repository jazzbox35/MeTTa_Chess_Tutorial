import { Metadata } from "next"
import { ChessClient } from "./client"

export const metadata: Metadata = {
  title: "Play Chess",
}

export default function ChessPage() {
  return <ChessClient />
}
