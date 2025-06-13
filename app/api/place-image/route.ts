import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    // Verifica autenticazione
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { placeLink } = await request.json()

    if (!placeLink) {
      return NextResponse.json({ error: "Missing place link" }, { status: 400 })
    }

    // Estrai l'ID del luogo dal link
    const placeId = extractPlaceIdFromLink(placeLink)

    if (!placeId) {
      return NextResponse.json({ error: "Invalid place link format" }, { status: 400 })
    }

    // In un'implementazione reale, qui utilizzeresti l'API di Google Places per ottenere l'immagine
    // Per questa demo, generiamo un URL placeholder
    const imageUrl = `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(placeId.placeId)}`

    return NextResponse.json({
      success: true,
      imageUrl,
    })
  } catch (error) {
    console.error("Error generating place image:", error)
    return NextResponse.json(
      {
        error: "Error generating place image",
      },
      { status: 500 },
    )
  }
}

// Funzione per estrarre l'ID del luogo da un link di Google Maps
function extractPlaceIdFromLink(link: string) {
  try {
    // Supporta diversi formati di URL di Google Maps
    const url = new URL(link)

    // Formato 1: https://maps.app.goo.gl/xxx
    if (url.hostname === "maps.app.goo.gl") {
      return { placeId: url.pathname.substring(1), isShortUrl: true }
    }

    // Formato 2: https://www.google.com/maps/place/...
    if (url.pathname.includes("/place/")) {
      const placeId = url.searchParams.get("place_id")
      if (placeId) return { placeId, isShortUrl: false }

      // Se non c'è un place_id esplicito, proviamo a estrarre dal percorso
      const pathParts = url.pathname.split("/")
      const placeIndex = pathParts.indexOf("place")
      if (placeIndex !== -1 && placeIndex < pathParts.length - 1) {
        return { placeId: pathParts[placeIndex + 1].split("/")[0], isShortUrl: false }
      }
    }

    // Formato 3: https://goo.gl/maps/xxx
    if (url.hostname === "goo.gl" && url.pathname.startsWith("/maps/")) {
      return { placeId: url.pathname.substring(6), isShortUrl: true }
    }

    return null
  } catch (e) {
    console.error("Errore nell'analisi del link:", e)
    return null
  }
}
