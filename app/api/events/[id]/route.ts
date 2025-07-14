import { type NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Usa aggregation per fare il join con la collezione users per ottenere i dati dell'host
    const events = await db
      .collection("events")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
        { $project: { hostData: 0 } },
      ])
      .toArray()

    if (!events || events.length === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    const event = events[0]

    // Incrementa le visualizzazioni
    await db.collection("events").updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } })

    // Converti ObjectId in stringhe per la serializzazione JSON
    const serializedEvent = {
      ...event,
      _id: event._id.toString(),
      hostId: event.hostId?.toString(),
      dateStart: event.dateStart?.toISOString?.() || event.dateStart,
      dateEnd: event.dateEnd?.toISOString?.() || event.dateEnd,
      createdAt: event.createdAt?.toISOString?.() || event.createdAt,
      updatedAt: event.updatedAt?.toISOString?.() || event.updatedAt,
    }

    return NextResponse.json(serializedEvent)
  } catch (error) {
    console.error("Error fetching event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const updateData = await request.json()

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("events").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "ID evento non valido" }, { status: 400 })
    }

    const { db } = await connectToDatabase()

    const result = await db.collection("events").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting event:", error)
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 })
  }
}
