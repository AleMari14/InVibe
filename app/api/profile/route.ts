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
      eventsCreated: events.length,
      eventsAttended: participatedEvents.length,
      totalViews: events.reduce((sum, event) => sum + (event.views || 0), 0),
      favoriteCount: favorites.length,
      totalReviews: reviews.length,
      totalBookings: bookings.length,
      responseRate: user.responseRate || 95,
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
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio || "",
      location: user.location || "",
      phone: user.phone || "",
      dateOfBirth: user.dateOfBirth || "",
      verified: user.verified || false,
      rating: user.rating || 0,
      reviewCount: user.reviewCount || 0,
      joinedAt: user.createdAt || new Date("2023-01-01").toISOString(),
      stats, // Assicurati che stats sia sempre presente
      eventi: formattedEvents,
      reviews: formattedReviews,
      bookings: formattedBookings,
      activities: [],
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
    const { name, bio, phone, location, dateOfBirth, image } = body

    // Validazione dei dati
    if (name && typeof name !== "string") {
      return NextResponse.json({ error: "Nome non valido" }, { status: 400 })
    }

    if (bio && typeof bio !== "string") {
      return NextResponse.json({ error: "Bio non valida" }, { status: 400 })
    }

    if (phone && typeof phone !== "string") {
      return NextResponse.json({ error: "Telefono non valido" }, { status: 400 })
    }

    if (location && typeof location !== "string") {
      return NextResponse.json({ error: "Località non valida" }, { status: 400 })
    }

    if (image && typeof image !== "string") {
      return NextResponse.json({ error: "Immagine non valida" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const updateData: any = {
      updatedAt: new Date(),
    }

    // Aggiorna solo i campi forniti
    if (name !== undefined) updateData.name = name.trim()
    if (bio !== undefined) updateData.bio = bio.trim()
    if (phone !== undefined) updateData.phone = phone.trim()
    if (location !== undefined) updateData.location = location.trim()
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (image !== undefined) updateData.image = image

    console.log("Updating user with data:", updateData)

    const result = await db.collection("users").updateOne({ email: session.user.email }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Utente non trovato" }, { status: 404 })
    }

    const updatedUser = await db.collection("users").findOne({ email: session.user.email })

    if (!updatedUser) {
      return NextResponse.json({ error: "Errore nel recupero dell'utente aggiornato" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Profilo aggiornato con successo",
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        image: updatedUser.image,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        location: updatedUser.location,
        dateOfBirth: updatedUser.dateOfBirth,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error) {
    console.error("Errore nell'aggiornamento del profilo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Errore interno del server",
        message: "Si è verificato un errore durante l'aggiornamento del profilo",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  return PATCH(request)
}
