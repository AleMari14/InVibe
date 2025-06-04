import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userEmail = session.user.email
    const userId = session.user.id // Assuming user.id is the MongoDB ObjectId string

    const { db } = await connectToDatabase()

    // Find conversations where the user is a participant
    // In your current schema, messages collection seems to store conversations.
    // A conversation might be represented by multiple message documents with the same roomId.
    // We need to group messages by roomId to get distinct conversations.

    const conversations = await db.collection("messages")
      .aggregate([
        { $match: { $or: [{ senderId: userEmail }, { receiverId: userEmail }] } },
        { $sort: { createdAt: -1 } }, // Sort to get the latest message first within each group
        { $group: {
            _id: "$roomId",
            lastMessage: { $first: "$$ROOT" },
            participants: { $addToSet: "$senderId" }, // Collect all unique participants
            // Calculate unread count for the current user
            unreadCount: { 
              $sum: {
                $cond: [
                  { $and: [
                      { $eq: ["$receiverId", userEmail] }, // Message received by current user
                      { $not: { $in: [userEmail, "$readBy"] } } // Message not read by current user
                  ]},
                  1,
                  0
                ]
              }
            }
        }},
        { $sort: { "lastMessage.createdAt": -1 } }, // Sort conversations by the latest message
        { $limit: 50 }, // Limit the number of conversations
      ])
      .toArray()

    // For each conversation, fetch details of the other participant
    const conversationsWithOtherUsers = await Promise.all(conversations.map(async (conv) => {
      const otherParticipantEmail = conv.participants.find((email: string) => email !== userEmail);
      let otherUser = null;
      if (otherParticipantEmail) {
         otherUser = await db.collection("users").findOne(
          { email: otherParticipantEmail.toLowerCase() },
          { projection: { name: 1, image: 1, email: 1 } } // Fetch only necessary fields
        );
      }

      return {
        _id: conv._id,
        lastMessage: {
          content: conv.lastMessage.content,
          createdAt: conv.lastMessage.createdAt,
          senderId: conv.lastMessage.senderId,
        },
        unreadCount: conv.unreadCount,
        otherUser: otherUser || { name: "Unknown User", email: "", image: "" }, // Provide a fallback
      };
    }));

    return NextResponse.json(conversationsWithOtherUsers)
  } catch (error) {
    console.error("Error fetching user conversations:", error)
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
} 