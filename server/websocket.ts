import type { Server, Socket } from "socket.io"
import clientPromise from "../lib/mongodb"
import { ObjectId } from "mongodb"

interface SocketMessage {
  content: string
  roomId: string
  senderId: string
  senderName: string
  senderImage?: string
}

export function setupSocketIO(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`A client connected: ${socket.id}`)

    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId)
      console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on("leaveRoom", (roomId: string) => {
      socket.leave(roomId)
      console.log(`Socket ${socket.id} left room ${roomId}`)
    })

    socket.on("sendMessage", async (message: SocketMessage) => {
      try {
        const client = await clientPromise
        const db = client.db("invibe")

        const messageDocument = {
          roomId: new ObjectId(message.roomId),
          senderId: new ObjectId(message.senderId),
          senderName: message.senderName,
          senderImage: message.senderImage,
          content: message.content,
          createdAt: new Date(),
          readBy: [new ObjectId(message.senderId)],
        }

        const result = await db.collection("messages").insertOne(messageDocument)

        const messageToSend = {
          ...messageDocument,
          _id: result.insertedId,
        }

        io.to(message.roomId).emit("receiveMessage", messageToSend)
      } catch (error) {
        console.error("Error handling message:", error)
        socket.emit("messageError", { error: "Failed to send message." })
      }
    })

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}
