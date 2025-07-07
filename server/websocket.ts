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
    console.log(`[Socket.IO] Client connected: ${socket.id}`)

    socket.on("joinRoom", (roomId: string) => {
      if (!roomId || typeof roomId !== "string") {
        console.error(`[Socket.IO] Invalid roomId received for joinRoom: ${roomId}`)
        return
      }
      socket.join(roomId)
      console.log(`[Socket.IO] Socket ${socket.id} joined room ${roomId}`)
    })

    socket.on("leaveRoom", (roomId: string) => {
      if (!roomId || typeof roomId !== "string") {
        console.error(`[Socket.IO] Invalid roomId received for leaveRoom: ${roomId}`)
        return
      }
      socket.leave(roomId)
      console.log(`[Socket.IO] Socket ${socket.id} left room ${roomId}`)
    })

    socket.on("sendMessage", async (message: SocketMessage) => {
      try {
        if (!message || !ObjectId.isValid(message.roomId) || !ObjectId.isValid(message.senderId)) {
          console.error("[Socket.IO] Invalid message data received:", message)
          socket.emit("messageError", { error: "Dati del messaggio non validi." })
          return
        }

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
          _id: result.insertedId.toString(),
          roomId: message.roomId, // Invia l'ID come stringa al client
          senderId: message.senderId,
        }

        io.to(message.roomId).emit("receiveMessage", messageToSend)
      } catch (error) {
        console.error("[Socket.IO] Error handling message:", error)
        socket.emit("messageError", { error: "Impossibile inviare il messaggio." })
      }
    })

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}, reason: ${reason}`)
    })
  })
}
