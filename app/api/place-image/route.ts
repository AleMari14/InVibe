import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { placeLink } = await request.json()

    if (!placeLink) {
      return NextResponse.json({ error: "Link mancante" }, { status: 400 })
    }

    // Estrai l'ID del posto dal link di Google Maps
    let placeId = null

    // Formato: https://maps.google.com/maps?q=place_id:ChIJN1t_tDeuEmsRUsoyG83frY4
    const placeIdMatch = placeLink.match(/place_id:([^&]+)/)
    if (placeIdMatch) {
      placeId = placeIdMatch[1]
    }

    // Formato: https://maps.app.goo.gl/abcdefg123456
    // Per questo formato, useremo un'immagine generica

    // Formato: https://www.google.com/maps/place/.../@lat,lng,zoom/data=...
    const coordsMatch = placeLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)

    let imageUrl = ""

    if (placeId) {
      // Usa l'ID del posto per generare un'URL dell'immagine
      imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=place_id:${placeId}&zoom=16&size=600x400&maptype=roadmap&markers=color:red%7C${placeId}&key=YOUR_API_KEY`
    } else if (coordsMatch) {
      // Usa le coordinate per generare un'URL dell'immagine
      const lat = coordsMatch[1]
      const lng = coordsMatch[2]
      imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x400&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=YOUR_API_KEY`
    } else {
      // Usa un'immagine generica di OpenStreetMap
      const randomLat = 41.9028 + (Math.random() * 0.02 - 0.01) // Roma, Italia con piccola variazione
      const randomLng = 12.4964 + (Math.random() * 0.02 - 0.01)
      imageUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${randomLng},${randomLat},14,0/600x400?access_token=YOUR_MAPBOX_TOKEN`

      // Poiché non abbiamo una chiave API, usiamo un'immagine di placeholder
      imageUrl = `https://via.placeholder.com/600x400?text=Immagine+Luogo`
    }

    return NextResponse.json({ imageUrl })
  } catch (error) {
    console.error("Error generating place image:", error)
    return NextResponse.json({ error: "Errore durante la generazione dell'immagine" }, { status: 500 })
  }
}
