// import { NextResponse } from "next/server"

// export async function GET() {
//   const apiKey = process.env.GOOGLE_MAPS_API_KEY

//   if (!apiKey) {
//     return NextResponse.json({ error: "Google Maps API key is not configured" }, { status: 500 })
//   }

//   // Restituisce l'URL dello script con la chiave API
//   return NextResponse.json({
//     url: `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`,
//   })
// }
