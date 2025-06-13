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

    const { placeLink, placeId } = await request.json()

    if (!placeLink) {
      return NextResponse.json({ error: "Link mancante", success: false }, { status: 400 })
    }

    // Estrai informazioni dal link
    const locationInfo = placeId || extractPlaceIdFromLink(placeLink)

    if (!locationInfo) {
      // Fallback: genera un'immagine casuale
      const randomId = Math.random().toString(36).substring(2, 10)
      const imageUrl = `/placeholder.svg?height=400&width=600&query=location%20${randomId}`

      return NextResponse.json({
        success: true,
        imageUrl,
        message: "Immagine generata (placeholder)",
      })
    }

    // In un'implementazione reale, qui utilizzeresti l'API di Google Places o un servizio simile
    // Per questa demo, generiamo un URL placeholder con il placeId come query
    const imageUrl = `/placeholder.svg?height=400&width=600&query=location%20${encodeURIComponent(locationInfo)}`

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

// Funzione per estrarre l'ID del luogo da un link di Google Maps
function extractPlaceIdFromLink(link: string) {
  try {
    // Supporta diversi formati di URL di Google Maps
    const url = new URL(link)

    // Formato 1: https://maps.app.goo.gl/xxx
    if (url.hostname === "maps.app.goo.gl") {
      return url.pathname.substring(1)
    }

    // Formato 2: https://www.google.com/maps/place/...
    if (url.pathname.includes("/place/")) {
      const placeId = url.searchParams.get("place_id")
      if (placeId) return placeId

      // Se non c'è un place_id esplicito, proviamo a estrarre dal percorso
      const pathParts = url.pathname.split("/")
      const placeIndex = pathParts.indexOf("place")
      if (placeIndex !== -1 && placeIndex < pathParts.length - 1) {
        return pathParts[placeIndex + 1].split("/")[0]
      }
    }

    // Formato 3: https://goo.gl/maps/xxx
    if (url.hostname === "goo.gl" && url.pathname.startsWith("/maps/")) {
      return url.pathname.substring(6)
    }

    // Estrai coordinate come fallback
    const coordsMatch = url.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (coordsMatch) {
      return `${coordsMatch[1]},${coordsMatch[2]}`
    }

    return null
  } catch (e) {
    console.error("Errore nell'analisi del link:", e)
    return null
  }
}
