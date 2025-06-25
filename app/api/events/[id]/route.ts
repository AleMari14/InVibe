import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🔍 GET /api/events/[id] called with ID:", params.id)

    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")

    // Use aggregation to get event with host information
    const events = await eventsCollection
      .aggregate([
        { $match: { _id: new ObjectId(params.id) } },
        {
          $lookup: {
            from: "users",
            localField: "hostId",
            foreignField: "_id",
            as: "hostInfo",
          },
        },
        {
          $addFields: {
            host: {
              $cond: {
                if: { $gt: [{ $size: "$hostInfo" }, 0] },
                then: {
                  _id: { $arrayElemAt: ["$hostInfo._id", 0] },
                  name: { $arrayElemAt: ["$hostInfo.name", 0] },
                  email: { $arrayElemAt: ["$hostInfo.email", 0] },
                  image: { $arrayElemAt: ["$hostInfo.image", 0] },
                  verified: { $arrayElemAt: ["$hostInfo.verified", 0] },
                  rating: { $arrayElemAt: ["$hostInfo.rating", 0] },
                  reviewCount: { $arrayElemAt: ["$hostInfo.reviewCount", 0] },
                },
                else: null,
              },
            },
          },
        },
        { $project: { hostInfo: 0 } },
      ])
      .toArray()

    if (events.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const event = events[0]

    // Increment view count
    await eventsCollection.updateOne({ _id: new ObjectId(params.id) }, { $inc: { views: 1 } })

    // Serialize the event data
    const serializedEvent = {
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
      host: event.host
        ? {
            ...event.host,
            _id: event.host._id?.toString(),
          }
        : null,
    }

    console.log("✅ Event found:", serializedEvent.title)
    console.log("📋 Host info:", serializedEvent.host)

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("💥 Error in GET /api/events/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("📝 PUT /api/events/[id] called with ID:", params.id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const body = await request.json()
    console.log("📋 Update data received:", body)

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")
    const usersCollection = db.collection("users")

    // Get current user
    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if event exists and user is the owner
    const event = await eventsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.hostId.equals(user._id)) {
      return NextResponse.json({ error: "Not authorized to edit this event" }, { status: 403 })
    }

    // Update event
    const updateData = {
      ...body,
      updatedAt: new Date(),
    }

    // Remove fields that shouldn't be updated
    delete updateData._id
    delete updateData.hostId
    delete updateData.createdAt
    delete updateData.views
    delete updateData.participants

    const result = await eventsCollection.updateOne({ _id: new ObjectId(params.id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log("✅ Event updated successfully")

    return NextResponse.json({
      success: true,
      message: "Evento aggiornato con successo!",
    })
  } catch (error) {
    console.error("💥 Error in PUT /api/events/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("🗑️ DELETE /api/events/[id] called with ID:", params.id)

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!params.id || !ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid event ID" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("invibe")
    const eventsCollection = db.collection("events")
    const usersCollection = db.collection("users")

    // Get current user
    const user = await usersCollection.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if event exists and user is the owner
    const event = await eventsCollection.findOne({ _id: new ObjectId(params.id) })
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (!event.hostId.equals(user._id)) {
      return NextResponse.json({ error: "Not authorized to delete this event" }, { status: 403 })
    }

    // Delete event
    const result = await eventsCollection.deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    console.log("✅ Event deleted successfully")

    return NextResponse.json({
      success: true,
      message: "Evento eliminato con successo!",
    })
  } catch (error) {
    console.error("💥 Error in DELETE /api/events/[id]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
