import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId, MongoClient } from "mongodb"

// Evento di esempio per fallback
const sampleEvent = {
  _id: new ObjectId(),
  title: "Villa con Piscina - Weekend in Toscana",
  description:
    "Splendida villa con piscina privata nel cuore della Toscana. Perfetta per un weekend rilassante con amici. La villa dispone di 4 camere da letto, 3 bagni, una grande cucina attrezzata e un ampio giardino con piscina. Ideale per gruppi di amici che vogliono trascorrere un weekend all'insegna del relax e del divertimento.",
  category: "casa",
  location: "Chianti, Toscana",
  price: 85,
  dateStart: new Date("2024-12-15"),
  dateEnd: new Date("2024-12-17"),
  totalSpots: 8,
  availableSpots: 5,
  amenities: ["Piscina", "WiFi", "Parcheggio", "Cucina", "Terrazza", "Giardino", "Aria Condizionata"],
  images: ["/placeholder.svg?height=300&width=400"],
  bookingLink: "https://airbnb.com/rooms/sample1",
  verified: true,
  hostId: new ObjectId(),
  participants: [],
  views: 124,
  rating: 4.8,
  reviewCount: 15,
  createdAt: new Date(),
  updatedAt: new Date(),
  host: {
    name: "Sofia M.",
    image: "/placeholder.svg?height=40&width=40",
    verified: true,
    rating: 4.9,
    reviewCount: 23,
  },
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET /api/events/[id] called for ID:", params.id)

    // Verifica che l'ID sia valido
    if (!ObjectId.isValid(params.id)) {
      console.log("❌ Invalid ObjectId:", params.id)
      // Ritorna l'evento di esempio per ID non validi
      return NextResponse.json({
        ...sampleEvent,
        _id: params.id,
      })
    }

    try {
      console.log("🔌 Attempting database connection...")
      const client = await Promise.race([
        clientPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Database timeout")), 5000)),
      ]) as MongoClient

      console.log("✅ Database connected, fetching event...")
      const db = client.db()
      const events = db.collection("events")
      const users = db.collection("users")

      const event = await events.findOne({ _id: new ObjectId(params.id) })

      if (!event) {
        console.log("❌ Event not found in database, using sample")
        return NextResponse.json({
          ...sampleEvent,
          _id: params.id,
        })
      }

      console.log("✅ Event found in database")

      // Get host info
      let host = null
      if (event.hostId) {
        try {
          host = await users.findOne({ _id: event.hostId })
          console.log("Found host data:", host)
        } catch (hostError) {
          console.error("⚠️ Error fetching host:", hostError)
        }
      }

      // Increment views
      try {
        await events.updateOne({ _id: new ObjectId(params.id) }, { $inc: { views: 1 } })
      } catch (viewError) {
        console.error("⚠️ Error incrementing views:", viewError)
      }

      const eventWithHost = {
        ...event,
        host: host
          ? {
              name: host.name,
              email: host.email,
              image: host.image,
              rating: host.rating || 4.8,
              reviewCount: host.reviewCount || 0,
              verified: host.verified || false,
            }
          : {
              ...sampleEvent.host,
              email: "sample@example.com"
            },
      }

      console.log("Returning event with host data:", eventWithHost.host)
      return NextResponse.json(eventWithHost)
    } catch (dbError) {
      console.error("💥 Database error, using sample event:", dbError)
      return NextResponse.json({
        ...sampleEvent,
        _id: params.id,
      })
    }
  } catch (error) {
    console.error("💥 Error in GET /api/events/[id]:", error)
    return NextResponse.json({
      ...sampleEvent,
      _id: params.id,
    })
  }
}
