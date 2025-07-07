import { Server } from "socket.io"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import { connectToDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

interface SocketServer extends HTTPServer {
  io?: Server
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

const SocketHandler = (req: NextApiRequest, res: NextApiResponseWithSocket) => {
  if (res.socket.server.io) {
    console.log("Socket is already running")
  } else {
    console.log("Socket is initializing")
    const io = new Server(res.socket.server, {
      path: "/socket.io",
      addTrailingSlash: false,
    })
    res.socket.server.io = io

    io.on("connection", async (socket) => {
      console.log("A user connected:", socket.id)
      const userId = socket.handshake.query.userId as string

      if (userId && ObjectId.isValid(userId)) {
        socket.join(userId)
        console.log(`User ${userId} joined their room`)
      }

      socket.on("sendMessage", async (data) => {
        const { roomId, senderId, receiverId, content } = data
        console.log("Message received on server:", data)

        try {
          const { db } = await connectToDatabase()
          const message = {
            roomId: new ObjectId(roomId),
            senderId: new ObjectId(senderId),
            content,
            createdAt: new Date(),
            read: false,
          }
          await db.collection("messages").insertOne(message)

          // Emit to receiver
          io.to(receiverId).emit("receiveMessage", message)

          // Create notification for receiver
          const room = await db.collection("chatRooms").findOne({ _id: new ObjectId(roomId) })
          if (room) {
            const sender = room.participants.find((p: any) => p.id.toString() === senderId)
            if (sender) {
              const notification = {
                userId: new ObjectId(receiverId),
                type: "new_message",
                content: `Nuovo messaggio da ${sender.name}`,
                link: `/messaggi/${roomId}`,
                read: false,
                createdAt: new Date(),
              }
              await db.collection("notifications").insertOne(notification)
              io.to(receiverId).emit("newNotification", notification)
            }
          }
        } catch (error) {
          console.error("Error handling message:", error)
        }
      })

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id)
      })
    })
  }
  res.end()
}

export const GET = SocketHandler
export const POST = SocketHandler
