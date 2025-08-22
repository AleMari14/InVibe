import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import clientPromise from "../lib/mongodb"
import { ObjectId } from "mongodb"

interface OnlineUser {
  userId: string
  email: string
  socketId: string
  lastSeen: Date
}

const onlineUsers = new Map<string, OnlineUser>()

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`)

    // Handle user authentication and online status
    socket.on("authenticate", (userData: { email: string; userId: string }) => {
      console.log(`👤 User authenticated: ${userData.email}`)

      onlineUsers.set(socket.id, {
        userId: userData.userId,
        email: userData.email,
        socketId: socket.id,
        lastSeen: new Date(),
      })

      // Notify all users about this user's online status
      socket.broadcast.emit("userOnlineStatus", {
        email: userData.email,
        isOnline: true,
      })
    })

    // Handle checking if a user is online
    socket.on("checkUserOnline", (email: string) => {
      const isOnline = Array.from(onlineUsers.values()).some((user) => user.email === email)
      socket.emit("userOnlineStatus", {
        email,
        isOnline,
      })
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
    socket.on(
      "sendMessage",
      async (messageData: {
        roomId: string
        senderId: string
        senderName: string
        senderImage?: string
        content: string
      }) => {
        try {
          console.log(`💬 Message received for room ${messageData.roomId}:`, messageData.content)

          const client = await clientPromise
          const db = client.db("invibe")

          // Save message to database
          const message = {
            roomId: new ObjectId(messageData.roomId),
            senderId: messageData.senderId,
            senderName: messageData.senderName,
            senderImage: messageData.senderImage,
            content: messageData.content,
            createdAt: new Date(),
            readBy: [messageData.senderId],
          }

          const result = await db.collection("messages").insertOne(message)

          // Update chat room's last message
          await db.collection("chatRooms").updateOne(
            { _id: new ObjectId(messageData.roomId) },
            {
              $set: {
                lastMessage: messageData.content,
                lastMessageAt: new Date(),
                updatedAt: new Date(),
              },
            },
          )

          const savedMessage = {
            ...message,
            _id: result.insertedId.toString(),
            roomId: messageData.roomId,
            createdAt: message.createdAt.toISOString(),
          }

          // Emit message to all users in the room
          io.to(messageData.roomId).emit("receiveMessage", savedMessage)

          console.log(`✅ Message saved and broadcasted to room ${messageData.roomId}`)
        } catch (error) {
          console.error("❌ Error handling message:", error)
          socket.emit("messageError", { error: "Failed to send message" })
        }
      },
    )

    // Handle marking messages as read
    socket.on("markAsRead", async (data: { roomId: string; userId: string }) => {
      try {
        const client = await clientPromise
        const db = client.db("invibe")

        await db.collection("messages").updateMany(
          {
            roomId: new ObjectId(data.roomId),
            readBy: { $ne: data.userId },
          },
          {
            $addToSet: { readBy: data.userId },
          },
        )

        console.log(`✅ Messages marked as read for user ${data.userId} in room ${data.roomId}`)
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
      console.log(`🔌 User disconnected: ${socket.id}`)

      const user = onlineUsers.get(socket.id)
      if (user) {
        // Notify all users about this user going offline
        socket.broadcast.emit("userOnlineStatus", {
          email: user.email,
          isOnline: false,
        })

        onlineUsers.delete(socket.id)
        console.log(`👤 User ${user.email} marked as offline`)
      }
    })

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`❌ Socket error for ${socket.id}:`, error)
    })
  })

  // Cleanup offline users periodically
  setInterval(() => {
    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)

    for (const [socketId, user] of onlineUsers.entries()) {
      if (user.lastSeen < fiveMinutesAgo) {
        console.log(`🧹 Cleaning up inactive user: ${user.email}`)
        onlineUsers.delete(socketId)

        // Notify about user going offline
        io.emit("userOnlineStatus", {
          email: user.email,
          isOnline: false,
        })
      }
    }
  }, 60000) // Check every minute

  console.log("🚀 WebSocket server initialized")
  return io
}

// Helper function to get online users count
export function getOnlineUsersCount(): number {
  return onlineUsers.size
}

// Helper function to check if a user is online
export function isUserOnline(email: string): boolean {
  return Array.from(onlineUsers.values()).some((user) => user.email === email)
}
