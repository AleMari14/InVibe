import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

// Configura Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string

    if (!file) {
      return NextResponse.json({ error: "Nessun file fornito" }, { status: 400 })
    }

    // Verifica il tipo di file
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Il file deve essere un'immagine" }, { status: 400 })
    }

    // Verifica la dimensione del file (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Il file deve essere inferiore a 10MB" }, { status: 400 })
    }

    // Converti il file in buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Carica su Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: "image",
            folder: type === "profile" ? "invibe/profiles" : "invibe/events",
            transformation: [{ width: 800, height: 600, crop: "limit" }, { quality: "auto" }, { format: "auto" }],
          },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error)
              reject(error)
            } else {
              resolve(result)
            }
          },
        )
        .end(buffer)
    })

    const result = uploadResponse as any

    if (!result || !result.secure_url) {
      throw new Error("Errore nel caricamento su Cloudinary")
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      message: "Immagine caricata con successo",
    })
  } catch (error) {
    console.error("Errore nell'upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server durante il caricamento dell'immagine",
      },
      { status: 500 },
    )
  }
}
