import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    // In un'implementazione reale, qui gestiresti il caricamento dell'immagine su un servizio come Cloudinary
    // Per questa demo, generiamo un URL placeholder
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Nessun file caricato" }, { status: 400 })
    }

    // Verifica che sia un'immagine
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Il file deve essere un'immagine" }, { status: 400 })
    }

    // Genera un URL placeholder basato sul nome del file
    const imageUrl = `/placeholder.svg?height=400&width=600&query=uploaded%20image%20${encodeURIComponent(file.name)}`

    return NextResponse.json({
      success: true,
      url: imageUrl,
      message: "Immagine caricata con successo",
    })
  } catch (error) {
    console.error("Error uploading image:", error)
    return NextResponse.json(
      {
        error: "Errore durante il caricamento dell'immagine",
      },
      { status: 500 },
    )
  }
}
