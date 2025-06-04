import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Genera un nome file univoco
    const uniqueId = uuidv4()
    const extension = file.name.split(".").pop()
    const fileName = `${uniqueId}.${extension}`

    // Salva il file nella cartella public/uploads
    const uploadDir = join(process.cwd(), "public", "uploads")
    const filePath = join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    // Restituisci l'URL del file
    const fileUrl = `/uploads/${fileName}`
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Errore nel caricamento del file:", error)
    return NextResponse.json({ error: "Errore nel caricamento del file" }, { status: 500 })
  }
} 