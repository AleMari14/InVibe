import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Mock data for demo user
const demoUserData = {
  user: {
    name: "Marco Rossi",
    email: "marco@example.com",
    image: null,
    bio: "Utente demo",
    phone: "+39 123 456 7890",
    location: "Milano, Italia",
    verified: true,
    joinDate: new Date().toISOString(),
  },
  stats: {
    eventiPartecipati: 3,
    eventiOrganizzati: 2,
    recensioni: 5,
  },
  eventi: [
    {
      _id: "demo-event-1",
      title: "Demo Event 1",
      date: new Date().toISOString(),
      status: "Attivo",
      partecipanti: 5,
      totale: 10,
      image: "/images/placeholder.jpg",
      views: 100,
    },
    {
      _id: "demo-event-2",
      title: "Demo Event 2",
      date: new Date().toISOString(),
      status: "Completato",
      partecipanti: 8,
      totale: 8,
      image: "/images/placeholder.jpg",
      views: 75,
    },
  ],
  prenotazioni: [
    {
      _id: "demo-booking-1",
      title: "Demo Booking 1",
      date: new Date().toISOString(),
      status: "Confermata",
      organizzatore: "Organizzatore Demo",
      image: "/images/placeholder.jpg",
    },
  ],
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log("🔍 Session data:", session)

    if (!session?.user?.id) {
      console.log("❌ No user ID in session")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Handle demo user
    if (session.user.id === "demo-user-id") {
      console.log("👤 Using demo user data")
      return NextResponse.json(demoUserData)
    }

    const { db } = await connectToDatabase()
    console.log("📦 User ID from session:", session.user.id)

    try {
      // Validate the user ID format
      if (!ObjectId.isValid(session.user.id)) {
        console.error("❌ Invalid user ID format:", session.user.id)
        return new NextResponse("Invalid user ID format", { status: 400 })
      }

      const user = await db.collection("users").findOne({ _id: new ObjectId(session.user.id) })
      console.log("👤 User found:", user ? "Yes" : "No")

      if (!user) {
        console.log("❌ User not found in database")
        return new NextResponse("User not found", { status: 404 })
      }

      // Calculate stats
      const stats = {
        eventiPartecipati: await db.collection("bookings").countDocuments({ userId: user._id }),
        eventiOrganizzati: await db.collection("events").countDocuments({ organizerId: user._id }),
        recensioni: await db.collection("reviews").countDocuments({ userId: user._id }),
      }
      console.log("📊 User stats:", stats)

      // Get organized events
      const eventi = await db.collection("events")
        .find({ organizerId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray()
      console.log("🎉 Organized events:", eventi.length)

      // Get bookings
      const prenotazioni = await db.collection("bookings")
        .find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray()
      console.log("📅 Bookings:", prenotazioni.length)

      return NextResponse.json({
        user: {
          name: user.name,
          email: user.email,
          image: user.image,
          bio: user.bio,
          phone: user.phone,
          location: user.location,
          verified: user.verified,
          joinDate: user.createdAt,
        },
        stats,
        eventi,
        prenotazioni,
      })
    } catch (dbError) {
      console.error("💥 Database error:", dbError)
      throw dbError
    }
  } catch (error) {
    console.error("💥 Error in profile API:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const data = await req.json()
    const { db } = await connectToDatabase()

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(session.user.id) },
      { $set: { ...data, updatedAt: new Date() } }
    )

    if (result.matchedCount === 0) {
      return new NextResponse("User not found", { status: 404 })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 