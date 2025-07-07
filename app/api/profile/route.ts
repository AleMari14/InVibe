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

    // Calculate user statistics
    const [eventsCreated, eventsParticipated, totalBookings, totalReviews] = await Promise.all([
      // Events created by user
      db
        .collection("events")
        .countDocuments({
          $or: [
            { hostId: user._id },
            { hostId: user._id.toString() },
            { createdBy: user._id },
            { createdBy: user._id.toString() },
          ],
        }),
      // Events user participated in
      db
        .collection("bookings")
        .countDocuments({
          userId: user._id,
          status: "confirmed",
        }),
      // Total bookings made by user
      db
        .collection("bookings")
        .countDocuments({
          userId: user._id,
        }),
      // Total reviews written by user
      db
        .collection("reviews")
        .countDocuments({
          userId: user._id,
        }),
    ])

    // Get user's events for additional stats
    const userEvents = await db
      .collection("events")
      .find({
        $or: [
          { hostId: user._id },
          { hostId: user._id.toString() },
          { createdBy: user._id },
          { createdBy: user._id.toString() },
        ],
      })
      .toArray()

    const totalViews = userEvents.reduce((sum, event) => sum + (event.views || 0), 0)
    const totalParticipants = userEvents.reduce(
      (sum, event) => sum + ((event.totalSpots || 0) - (event.availableSpots || 0)),
      0,
    )

    // Calculate average rating
    const userReviews = await db.collection("reviews").find({ hostId: user._id }).toArray()

    const averageRating =
      userReviews.length > 0 ? userReviews.reduce((sum, review) => sum + review.rating, 0) / userReviews.length : 0

    const userProfile = {
      _id: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      image: user.image || "",
      bio: user.bio || "",
      phone: user.phone || "",
      location: user.location || "",
      verified: user.verified || false,
      rating: averageRating,
      reviewCount: userReviews.length,
      joinDate: user.createdAt || new Date(),
      favorites: user.favorites || [],
      createdAt: user.createdAt || new Date(),
      updatedAt: user.updatedAt || new Date(),
    }

    const stats = {
      totalEvents: eventsCreated,
      totalBookings,
      totalViews,
      totalParticipants,
      averageRating,
      completionRate: 100, // Default completion rate
      eventsOrganized: eventsCreated,
      eventsParticipated,
      totalReviews,
    }

    return NextResponse.json({
      user: userProfile,
      stats,
    })
  } catch (error: any) {
    console.error("💥 Error fetching profile:", error)
    return NextResponse.json(
      {
        error: "Errore nel caricamento del profilo",
        details: error.message,
      },
      { status: 500 },
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

    // Update user profile
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    const result = await db.collection("users").updateOne({ _id: user._id }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Errore nell'aggiornamento" }, { status: 400 })
    }

    return NextResponse.json({ message: "Profilo aggiornato con successo" })
  } catch (error: any) {
    console.error("💥 Error updating profile:", error)
    return NextResponse.json(
      {
        error: "Errore nell'aggiornamento del profilo",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
