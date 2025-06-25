import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    console.log("📊 Calculating stats for user:", user._id)

    // Count events organized by user
    const eventsOrganized = await db.collection("events").countDocuments({
      $or: [
        { hostId: user._id },
        { hostId: user._id.toString() },
        { createdBy: user._id },
        { createdBy: user._id.toString() },
      ],
    })

    // Count events participated in (bookings)
    const eventsParticipated = await db.collection("bookings").countDocuments({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    })

    // Count total bookings for user's events
    const totalBookings = await db.collection("bookings").countDocuments({
      eventId: {
        $in: await db
          .collection("events")
          .find({
            $or: [{ hostId: user._id }, { hostId: user._id.toString() }],
          })
          .map((event) => event._id)
          .toArray(),
      },
    })

    // Count reviews written by user
    const totalReviews = await db.collection("reviews").countDocuments({
      $or: [{ userId: user._id }, { userId: user._id.toString() }],
    })

    // Calculate average rating for user's events
    const userEvents = await db
      .collection("events")
      .find({
        $or: [{ hostId: user._id }, { hostId: user._id.toString() }],
      })
      .toArray()

    const totalRating = userEvents.reduce((sum, event) => sum + (event.rating || 0), 0)
    const averageRating = userEvents.length > 0 ? totalRating / userEvents.length : 0

    const stats = {
      eventsOrganized,
      eventsParticipated,
      totalBookings,
      totalReviews,
    }

    console.log("📈 User stats:", stats)

    const profileData = {
      _id: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
      phone: user.phone || "",
      location: user.location || "",
      verified: user.verified || false,
      rating: averageRating,
      reviewCount: totalReviews,
      joinDate: user.createdAt || user.joinDate || new Date(),
      stats,
    }

    return NextResponse.json(profileData)
  } catch (error) {
    console.error("💥 Error fetching profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    // Find user by email
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    // Update user profile
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    const result = await db.collection("users").updateOne({ _id: user._id }, { $set: updateData })

    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "Nessuna modifica effettuata" }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Profilo aggiornato con successo" })
  } catch (error) {
    console.error("💥 Error updating profile:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
