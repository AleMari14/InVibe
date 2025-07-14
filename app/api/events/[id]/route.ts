import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { db } = await connectToDatabase()
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    // Usa aggregation per fare il join con la collezione users
    const events = await db
      .collection("events")
      .aggregate([
        {
          $match: { _id: new ObjectId(id) },
        },
        {
          $lookup: {
            from: "users",
            localField: "hostId",
            foreignField: "_id",
            as: "hostData",
          },
        },
        {
          $addFields: {
            host: {
              $cond: {
                if: { $gt: [{ $size: "$hostData" }, 0] },
                then: {
                  _id: { $toString: { $arrayElemAt: ["$hostData._id", 0] } },
                  name: { $arrayElemAt: ["$hostData.name", 0] },
                  email: { $arrayElemAt: ["$hostData.email", 0] },
                  image: { $arrayElemAt: ["$hostData.image", 0] },
                },
                else: null,
              },
            },
          },
        },
        {
          $project: {
            hostData: 0,
            hostId: 0,
          },
        },
      ])
      .toArray()

    if (events.length === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    const event = events[0]

    // Serializza gli ObjectId
    const serializedEvent = {
      ...event,
      _id: event._id.toString(),
      createdAt: event.createdAt?.toISOString() || new Date().toISOString(),
      dateStart: event.dateStart?.toISOString() || new Date().toISOString(),
      dateEnd: event.dateEnd?.toISOString() || null,
    }

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
