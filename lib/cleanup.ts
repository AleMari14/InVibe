import clientPromise from "./mongodb"

export async function cleanupExpiredEvents() {
  try {
    console.log("🧹 Starting cleanup of expired events...")

    const client = await clientPromise
    const db = client.db("invibe")

    const now = new Date()
    console.log("⏰ Current time:", now.toISOString())

    // Find expired events
    const expiredEvents = await db
      .collection("events")
      .find({
        dateStart: { $lt: now },
      })
      .toArray()

    console.log(`📋 Found ${expiredEvents.length} expired events`)

    if (expiredEvents.length === 0) {
      console.log("✅ No expired events to cleanup")
      return { deletedEvents: 0, deletedBookings: 0, deletedChatRooms: 0 }
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

    return {
      deletedEvents: eventsResult.deletedCount,
      deletedBookings: bookingsResult.deletedCount,
      deletedChatRooms: chatRoomsResult.deletedCount,
      deletedMessages: messagesResult.deletedCount,
      updatedFavorites: favoritesResult.modifiedCount,
    }
  } catch (error) {
    console.error("💥 Error during cleanup:", error)
    throw error
  }
}
