import { connectToDatabase } from "./mongodb"

export async function cleanupExpiredEvents() {
  try {
    console.log("🧹 Starting cleanup of expired events...")

    const { db } = await connectToDatabase()
    const eventsCollection = db.collection("events")

    const now = new Date()
    console.log("⏰ Current time:", now.toISOString())

    // Find expired events
    const expiredEvents = await eventsCollection
      .find({
        dateStart: { $lt: now },
      })
      .toArray()

    console.log(`📋 Found ${expiredEvents.length} expired events`)

    if (expiredEvents.length > 0) {
      // Delete expired events
      const deleteResult = await eventsCollection.deleteMany({
        dateStart: { $lt: now },
      })

      console.log(`🗑️ Deleted ${deleteResult.deletedCount} expired events`)

      // Also cleanup related bookings
      const bookingsCollection = db.collection("bookings")
      const expiredEventIds = expiredEvents.map((event) => event._id)

      const bookingDeleteResult = await bookingsCollection.deleteMany({
        eventId: { $in: expiredEventIds },
      })

      console.log(`🗑️ Deleted ${bookingDeleteResult.deletedCount} related bookings`)

      // Cleanup chat rooms for expired events
      const chatRoomsCollection = db.collection("chatRooms")
      const chatDeleteResult = await chatRoomsCollection.deleteMany({
        eventId: { $in: expiredEventIds },
      })

      console.log(`🗑️ Deleted ${chatDeleteResult.deletedCount} related chat rooms`)

      return {
        eventsDeleted: deleteResult.deletedCount,
        bookingsDeleted: bookingDeleteResult.deletedCount,
        chatRoomsDeleted: chatDeleteResult.deletedCount,
      }
    }

    return {
      eventsDeleted: 0,
      bookingsDeleted: 0,
      chatRoomsDeleted: 0,
    }
  } catch (error) {
    console.error("💥 Error during cleanup:", error)
    throw error
  }
}
