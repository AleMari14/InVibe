import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    console.log("📝 /api/upload POST called")
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      console.log("❌ /api/upload: Unauthorized access")
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }
    console.log("✅ /api/upload: User authenticated")

    const formData = await request.formData()
    console.log("✅ /api/upload: Form data parsed")

    const file = formData.get("file") as File
    if (!file) {
      console.log("⚠️ /api/upload: No file uploaded")
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 })
    }
    console.log(`✅ /api/upload: File received - name: ${file.name}, size: ${file.size}`)

    const bytes = await file.arrayBuffer()
    console.log("✅ /api/upload: File bytes read")

    const buffer = Buffer.from(bytes)
    console.log("✅ /api/upload: Buffer created from bytes")

    // Genera un nome file univoco
    const uniqueId = uuidv4()
    const extension = file.name.split(".").pop()
    const fileName = `${uniqueId}.${extension}`
    console.log(`✅ /api/upload: Generated file name: ${fileName}`)

    // Salva il file nella cartella public/uploads
    // NOTA: Su Vercel, il filesystem è read-only, quindi questo potrebbe non funzionare in produzione
    try {
      const uploadDir = join(process.cwd(), "public", "uploads")
      const filePath = join(uploadDir, fileName)
      await writeFile(filePath, buffer)
      console.log("✅ /api/upload: File saved successfully")

      // Restituisci l'URL del file
      const fileUrl = `/uploads/${fileName}`
      return NextResponse.json({ url: fileUrl })
    } catch (writeError: any) {
      console.warn("⚠️ /api/upload: File writing failed (expected on Vercel):", writeError.message)

      // Su Vercel, restituiamo un URL temporaneo e un messaggio di avviso
      const fileUrl = `/uploads/${fileName}`
      return NextResponse.json(
        {
          url: fileUrl,
          message: "File processed, but not saved (filesystem is read-only). Implement cloud storage for production.",
          warning: "File upload skipped on serverless environment",
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    console.error("💥 Errore nel caricamento del file in /api/upload:", error)

    // Capture more details about the error in development
    const errorDetails =
      process.env.NODE_ENV === "development"
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
            ...(error.code && { code: error.code }),
          }
        : undefined

    return NextResponse.json(
      {
        error: "Errore interno del server durante il caricamento del file",
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}
