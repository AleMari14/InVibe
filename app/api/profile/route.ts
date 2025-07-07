import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Get user stats
    const eventsCreated = await db.collection("events").countDocuments({
      $or: [
        { hostId: user._id },
        { hostId: user._id.toString() },
        { createdBy: user._id },
        { createdBy: user._id.toString() },
        { "host.email": session.user.email.toLowerCase() },
      ],
    })

    const bookingsMade = await db.collection("bookings").countDocuments({
      userId: user._id,
    })

    const favoriteEvents = await db.collection("users").findOne(
      { _id: user._id },
      { projection: { favorites: 1 } }
    )

    const favoritesCount = favoriteEvents?.favorites?.length || 0

    // Transform user data
    const userData = {
      _id: user._id.toString(),
      name: user.name || "Utente",
      email: user.email,
      image: user.image || null,
      bio: user.bio || "",
      phone: user.phone || "",
      verified: Boolean(user.verified),
      rating: Number(user.rating) || 0,
      reviewCount: Number(user.reviewCount) || 0,
      joinDate: user.createdAt || user.joinDate || new Date(),
      stats: {
        eventsCreated,
        bookingsMade,
        favoritesCount,
      },
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    }

    return NextResponse.json(userData)
  } catch (error: any) {
    console.error("💥 Error fetching profile:", error)
    return NextResponse.json(
      {
        error: "Errore nel caricamento del profilo",
        details: error.message,
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    // Find user
    const user = await db.collection("users").findOne({
      email: session.user.email.toLowerCase(),
    })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Update user data
    const updateData = {
      name: body.name || user.name,
      bio: body.bio || user.bio,
      phone: body.phone || user.phone,
      image: body.image || user.image,
      updatedAt: new Date(),
    }

    const result = await db.collection("users").updateOne(
      { _id: user._id },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    return NextResponse.json({ message: "Profilo aggiornato con successo" })
  } catch (error: any) {
    console.error("💥 Error updating profile:", error)
    return NextResponse.json(
      {
        error: "Errore nell'aggiornamento del profilo",
        details: error.message,
      },
      { status: 500 }
    )
  }
}
