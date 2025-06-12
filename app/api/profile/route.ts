import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    const user = await db.collection("users").findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get user's events
    const events = await db.collection("events").find({ hostId: user._id }).sort({ createdAt: -1 }).toArray()

    // Get user's participated events
    const participatedEvents = await db.collection("bookings").find({ userId: user._id }).toArray()

    // Get user's reviews
    const reviews = await db.collection("reviews").find({ userId: user._id }).toArray()

    // Get user's bookings
    const bookings = await db.collection("bookings").find({ userId: user._id }).sort({ createdAt: -1 }).toArray()

    // Get user's favorites
    const favorites = await db.collection("favorites").find({ userId: user._id }).toArray()

    // Calculate stats
    const stats = {
      eventsParticipated: participatedEvents.length,
      eventsOrganized: events.length,
      totalReviews: reviews.length,
      totalBookings: bookings.length,
      totalFavorites: favorites.length,
      responseRate: user.responseRate || 95, // Default value if not set
    }

    // Format events
    const formattedEvents = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      location: event.location,
      price: event.price,
      dateStart: event.dateStart.toISOString(),
      dateEnd: event.dateEnd?.toISOString(),
      totalSpots: event.totalSpots,
      availableSpots: event.availableSpots,
      images: event.images || [],
      views: event.views || 0,
      rating: event.rating || 0,
      reviewCount: event.reviewCount || 0,
      verified: event.verified || false,
    }))

    // Format reviews
    const formattedReviews = reviews.map((review) => ({
      _id: review._id.toString(),
      userId: review.userId.toString(),
      eventId: review.eventId.toString(),
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt.toISOString(),
      userName: review.userName || "Utente",
      userImage: review.userImage,
      eventTitle: review.eventTitle || "Evento",
    }))

    // Format bookings
    const formattedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const event = await db.collection("events").findOne({ _id: booking.eventId })
        return {
          _id: booking._id.toString(),
          eventId: booking.eventId.toString(),
          userId: booking.userId.toString(),
          status: booking.status || "confermato",
          createdAt: booking.createdAt.toISOString(),
          eventTitle: event?.title || "Evento",
          eventImage: event?.images?.[0] || "",
          eventDate: event?.dateStart.toISOString() || new Date().toISOString(),
          guests: booking.guests || 1,
          totalPrice: booking.totalPrice || 0,
        }
      }),
    )

    return NextResponse.json({
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio || "",
      location: user.location || "",
      verified: user.verified || false,
      rating: user.rating || 0,
      reviewCount: user.reviewCount || 0,
      memberSince: user.createdAt || new Date("2023-01-01").toISOString(),
      stats,
      eventi: formattedEvents,
      reviews: formattedReviews,
      bookings: formattedBookings,
      activities: [], // Implementare in futuro
    })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 })
    }

    const body = await request.json()
    const { name, bio, phone, location, preferences, image } = body

    const { db } = await connectToDatabase()

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (bio !== undefined) updateData.bio = bio
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (preferences !== undefined) updateData.preferences = preferences
    if (image !== undefined) updateData.image = image

    updateData.updatedAt = new Date()

    const result = await db.collection("users").updateOne({ email: session.user.email }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const updatedUser = await db.collection("users").findOne({ email: session.user.email })

    return NextResponse.json({
      status: "success",
      message: "Profilo aggiornato con successo",
      user: {
        id: updatedUser?._id,
        name: updatedUser?.name,
        email: updatedUser?.email,
        image: updatedUser?.image,
        bio: updatedUser?.bio,
        phone: updatedUser?.phone,
        location: updatedUser?.location,
        preferences: updatedUser?.preferences,
        updatedAt: updatedUser?.updatedAt,
      },
    })
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Errore interno del server",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request)
}
