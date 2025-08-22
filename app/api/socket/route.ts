import { type NextRequest, NextResponse } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { createServer } from "http"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Global variable to store the Socket.IO server
let io: SocketIOServer | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    console.log("🚀 Initializing Socket.IO server...")

    // Create HTTP server for Socket.IO
    const httpServer = createServer()

    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["polling", "websocket"],
      allowEIO3: true,
    })

    io.on("connection", async (socket) => {
      console.log("👤 User connected:", socket.id)

      // Handle user authentication
      socket.on("authenticate", (userData: { userId: string; email: string }) => {
        console.log("🔐 User authenticated:", userData.email)
        socket.join(userData.userId)
      })

      // Handle joining chat rooms
      socket.on("joinRoom", (roomId: string) => {
        socket.join(roomId)
        console.log(`📱 User ${socket.id} joined room: ${roomId}`)
      })

      // Handle leaving chat rooms
      socket.on("leaveRoom", (roomId: string) => {
        socket.leave(roomId)
        console.log(`📱 User ${socket.id} left room: ${roomId}`)
      })

      // Handle sending messages
      socket.on("sendMessage", async (data) => {
        const { roomId, senderId, senderName, senderImage, content } = data
        console.log("💬 Message received:", { roomId, senderId, content })

        try {
          const { db } = await connectToDatabase()

          // Save message to database
          const message = {
            roomId: new ObjectId(roomId),
            senderId: new ObjectId(senderId),
            senderName,
            senderImage,
            content,
            createdAt: new Date(),
            read: false,
          }

          const result = await db.collection("messages").insertOne(message)

          // Create response message
          const responseMessage = {
            _id: result.insertedId.toString(),
            roomId,
            senderId,
            senderName,
            senderImage,
            content,
            createdAt: message.createdAt.toISOString(),
            read: false,
          }

          // Emit to all users in the room
          io?.to(roomId).emit("receiveMessage", responseMessage)

          console.log("✅ Message saved and broadcasted")
        } catch (error) {
          console.error("❌ Error handling message:", error)
          socket.emit("messageError", { error: "Failed to send message" })
        }
      })

      // Handle marking messages as read
      socket.on("markAsRead", async (data: { roomId: string; userId: string }) => {
        try {
          const { db } = await connectToDatabase()
          await db.collection("messages").updateMany(
            {
              roomId: new ObjectId(data.roomId),
              senderId: { $ne: new ObjectId(data.userId) },
            },
            {
              $set: { read: true },
            },
          )
          console.log("✅ Messages marked as read")
        } catch (error) {
          console.error("❌ Error marking messages as read:", error)
        }
      })

      // Handle typing indicators
      socket.on("typing", (data: { roomId: string; userName: string }) => {
        socket.to(data.roomId).emit("userTyping", {
          userName: data.userName,
          isTyping: true,
        })
      })

      socket.on("stopTyping", (data: { roomId: string; userName: string }) => {
        socket.to(data.roomId).emit("userTyping", {
          userName: data.userName,
          isTyping: false,
        })
      })

      // Handle disconnection
      socket.on("disconnect", () => {
        console.log("👋 User disconnected:", socket.id)
      })
    })

    console.log("✅ Socket.IO server initialized")
  }

  return NextResponse.json({ message: "Socket.IO server running" })
}

export async function POST(req: NextRequest) {
  return GET(req)
}
