import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorizzato", success: false }, { status: 401 })
    }

    const { placeLink } = await request.json()

    if (!placeLink) {
      return NextResponse.json({ error: "Link mancante", success: false }, { status: 400 })
    }

    // Genera un ID casuale per l'immagine
    const randomId = Math.random().toString(36).substring(2, 10)

    // Crea un'immagine placeholder con il nome del luogo estratto dal link
    let placeName = "location"

    try {
      const url = new URL(placeLink)
      if (url.pathname.includes("/place/")) {
        const pathParts = url.pathname.split("/")
        const placeIndex = pathParts.indexOf("place")
        if (placeIndex !== -1 && placeIndex < pathParts.length - 1) {
          placeName = pathParts[placeIndex + 1].split("/")[0]
        }
      }
    } catch (e) {
      console.error("Errore nell'analisi del link:", e)
    }

    // Crea un'immagine placeholder
    const imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(placeName)}%20${randomId}`

    return NextResponse.json({
      success: true,
      imageUrl,
      message: "Immagine generata con successo",
    })
  } catch (error) {
    console.error("Error generating place image:", error)
    return NextResponse.json(
      {
        error: "Errore durante la generazione dell'immagine",
        success: false,
      },
      { status: 500 },
    )
  }
}
