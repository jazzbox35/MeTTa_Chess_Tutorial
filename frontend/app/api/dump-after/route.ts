import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const filePath = path.join(process.cwd(), "dump.after")
    await fs.writeFile(filePath, body ?? "", "utf8")
    return NextResponse.json({ ok: true })
  } catch (error) {
    return new NextResponse("Failed to write dump.after", { status: 500 })
  }
}
