import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    console.log("🧹 Starting cleanup of expired events...")

    const client = await clientPromise
    const db = client.db("invibe")

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 giorni fa

    console.log("⏰ Current time:", now.toISOString())
    console.log("📅 One week ago:", oneWeekAgo.toISOString())

    // Find events that are expired for more than a week
    const expiredEvents = await db
      .collection("events")
      .find({
        dateStart: { $lt: oneWeekAgo },
      })
      .toArray()

    console.log(`📋 Found ${expiredEvents.length} events expired for more than a week`)

    if (expiredEvents.length === 0) {
      console.log("✅ No expired events to cleanup")
      return NextResponse.json({
        success: true,
        message: "No expired events to cleanup",
        deletedEvents: 0,
        deletedBookings: 0,
        deletedChatRooms: 0,
        deletedMessages: 0,
        updatedFavorites: 0,
      })
    }

    const expiredEventIds = expiredEvents.map((event) => event._id)
    console.log(
      "🗑️ Expired event IDs:",
      expiredEventIds.map((id) => id.toString()),
    )

    // Delete related bookings
    const bookingsResult = await db.collection("bookings").deleteMany({
      eventId: { $in: expiredEventIds },
    })
    console.log(`📝 Deleted ${bookingsResult.deletedCount} expired bookings`)

    // Delete related chat rooms
    const chatRoomsResult = await db.collection("chatRooms").deleteMany({
      eventId: { $in: expiredEventIds },
    })
    console.log(`💬 Deleted ${chatRoomsResult.deletedCount} expired chat rooms`)

    // Delete related messages
    const messagesResult = await db.collection("messages").deleteMany({
      eventId: { $in: expiredEventIds },
    })
    console.log(`📨 Deleted ${messagesResult.deletedCount} expired messages`)

    // Remove from user favorites
    const favoritesResult = await db
      .collection("users")
      .updateMany({ favorites: { $in: expiredEventIds } }, { $pullAll: { favorites: expiredEventIds } })
    console.log(`❤️ Updated ${favoritesResult.modifiedCount} user favorites`)

    // Delete expired events
    const eventsResult = await db.collection("events").deleteMany({
      _id: { $in: expiredEventIds },
    })
    console.log(`🎉 Deleted ${eventsResult.deletedCount} expired events`)

    console.log("✅ Cleanup completed successfully")

    return NextResponse.json({
      success: true,
      message: "Cleanup completed successfully",
      deletedEvents: eventsResult.deletedCount,
      deletedBookings: bookingsResult.deletedCount,
      deletedChatRooms: chatRoomsResult.deletedCount,
      deletedMessages: messagesResult.deletedCount,
      updatedFavorites: favoritesResult.modifiedCount,
    })
  } catch (error) {
    console.error("💥 Error during cleanup:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during cleanup",
      },
      { status: 500 },
    )
  }
}

// Funzione per nascondere eventi scaduti dalla visualizzazione
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db("invibe")

    const now = new Date()

    // Count events that should be hidden (expired but not yet deleted)
    const expiredEventsCount = await db.collection("events").countDocuments({
      dateStart: { $lt: now },
    })

    // Count events that should be deleted (expired for more than a week)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const toDeleteCount = await db.collection("events").countDocuments({
      dateStart: { $lt: oneWeekAgo },
    })

    return NextResponse.json({
      success: true,
      currentTime: now.toISOString(),
      expiredEventsCount,
      eventsToDeleteCount: toDeleteCount,
      message: `${expiredEventsCount} events are expired and hidden, ${toDeleteCount} events are ready for deletion`,
    })
  } catch (error) {
    console.error("Error checking expired events:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
