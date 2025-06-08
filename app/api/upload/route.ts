import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { cloudinary } from "@/lib/cloudinary"

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  [key: string]: any;
}

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
    const buffer = Buffer.from(bytes)

    // Upload to Cloudinary
    const uploadResponse = await new Promise<CloudinaryResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "invibe",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as CloudinaryResponse)
        }
      ).end(buffer)
    })

    if (!uploadResponse || !uploadResponse.secure_url) {
      throw new Error("Failed to upload to Cloudinary")
    }

    return NextResponse.json({ url: uploadResponse.secure_url })
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
