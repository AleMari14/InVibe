import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Recupera tutte le conversazioni dell'utente
    const conversations = await db
      .collection("messages")
      .aggregate([
        {
          $match: {
            participants: session.user.email,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { otherParticipant: { $arrayElemAt: ["$participants", 1] } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$email", "$$otherParticipant"] },
                },
              },
              {
                $project: {
                  _id: 0,
                  name: 1,
                  email: 1,
                  image: 1,
                },
              },
            ],
            as: "otherUser",
          },
        },
        {
          $unwind: "$otherUser",
        },
        {
          $lookup: {
            from: "messages",
            let: { roomId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$roomId", "$$roomId"] },
                },
              },
              {
                $sort: { createdAt: -1 },
              },
              {
                $limit: 1,
              },
            ],
            as: "lastMessage",
          },
        },
        {
          $unwind: "$lastMessage",
        },
        {
          $project: {
            _id: 1,
            otherUser: 1,
            lastMessage: {
              content: 1,
              createdAt: 1,
              senderId: 1,
            },
            unreadCount: {
              $size: {
                $filter: {
                  input: "$messages",
                  as: "message",
                  cond: {
                    $and: [
                      { $ne: ["$$message.senderId", session.user.email] },
                      { $not: { $in: [session.user.email, "$$message.readBy"] } },
                    ],
                  },
                },
              },
            },
          },
        },
      ])
      .toArray()

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { receiverId } = await req.json()
    if (!receiverId) {
      return new NextResponse("Receiver ID is required", { status: 400 })
    }

    const { db } = await connectToDatabase()

    // Verifica che l'utente ricevente esista
    const receiver = await db.collection("users").findOne({ email: receiverId })
    if (!receiver) {
      return new NextResponse("Receiver not found", { status: 404 })
    }

    // Cerca una conversazione esistente
    let conversation = await db.collection("messages").findOne({
      participants: {
        $all: [session.user.email, receiverId],
      },
    })

    // Se non esiste, crea una nuova conversazione
    if (!conversation) {
      const result = await db.collection("messages").insertOne({
        participants: [session.user.email, receiverId],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      conversation = {
        _id: result.insertedId,
        participants: [session.user.email, receiverId],
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    return NextResponse.json({ roomId: conversation._id })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 