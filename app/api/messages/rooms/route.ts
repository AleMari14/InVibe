import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { ObjectId } from "mongodb"
import { connectToDatabase } from "@/lib/mongodb"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { db } = await connectToDatabase()

    // Get all chat rooms where the user is a participant
    const rooms = await db.collection("chat_rooms")
      .aggregate([
        {
          $match: {
            participants: session.user.email
          }
        },
        {
          $lookup: {
            from: "messages",
            let: { roomId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$roomId", "$$roomId"] }
                }
              },
              {
                $sort: { createdAt: -1 }
              },
              {
                $limit: 1
              }
            ],
            as: "lastMessage"
          }
        },
        {
          $lookup: {
            from: "users",
            let: { otherParticipant: { $arrayElemAt: [{ $filter: { input: "$participants", as: "p", cond: { $ne: ["$$p", session.user.email] } } }, 0] } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$email", "$$otherParticipant"] }
                }
              },
              {
                $project: {
                  name: 1,
                  image: 1
                }
              }
            ],
            as: "otherUser"
          }
        },
        {
          $lookup: {
            from: "messages",
            let: { roomId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$roomId", "$$roomId"] },
                  senderId: { $ne: session.user.email },
                  readBy: { $ne: session.user.email }
                }
              },
              {
                $count: "count"
              }
            ],
            as: "unreadCount"
          }
        },
        {
          $project: {
            _id: 1,
            eventId: 1,
            eventTitle: 1,
            participants: 1,
            lastMessage: { $arrayElemAt: ["$lastMessage", 0] },
            unreadCount: { $arrayElemAt: ["$unreadCount.count", 0] },
            otherUser: { $arrayElemAt: ["$otherUser", 0] },
            archived: 1
          }
        },
        {
          $sort: {
            "lastMessage.createdAt": -1
          }
        }
      ])
      .toArray()

    return NextResponse.json({ rooms })
  } catch (error) {
    console.error("Error fetching chat rooms:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
