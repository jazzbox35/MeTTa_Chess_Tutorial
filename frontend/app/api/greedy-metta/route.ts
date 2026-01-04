import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "greedy.metta")
    const data = await fs.readFile(filePath)
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": 'attachment; filename="greedy.metta"',
      },
    })
  } catch (error) {
    console.error("Failed to read greedy.metta", error)
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}
