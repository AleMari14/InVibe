import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

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

    // Verifica la dimensione del file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Il file deve essere inferiore a 5MB" }, { status: 400 })
    }

    // Per ora, generiamo un URL placeholder
    // In produzione, qui caricheresti il file su un servizio di storage come Cloudinary, AWS S3, etc.
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "")}`
    const imageUrl = `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(fileName)}`

    // Simula un ritardo per l'upload
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: "Immagine caricata con successo",
    })
  } catch (error) {
    console.error("Errore nell'upload:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server",
      },
      { status: 500 },
    )
  }
}
