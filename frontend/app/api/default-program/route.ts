import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "greedy.metta")
    const data = await fs.readFile(filePath, "utf8")
    return new NextResponse(data, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    return new NextResponse("Default program not found", { status: 500 })
  }
}
