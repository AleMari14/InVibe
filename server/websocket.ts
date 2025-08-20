import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { connectToDatabase } from "../lib/mongodb"
import { ObjectId } from "mongodb"

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  })

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on("joinRoom", (roomId) => {
      console.log(`Socket ${socket.id} joining room: ${roomId}`)
      socket.join(roomId)
    })

    socket.on("sendMessage", async (messageData) => {
      try {
        console.log("Received message:", messageData)
        const { roomId, senderId, senderName, senderImage, content } = messageData

        if (!roomId || !senderId || !content) {
          socket.emit("messageError", { error: "Dati messaggio incompleti" })
          return
        }

        const { db } = await connectToDatabase()

        // Verifica che la room esista
        const room = await db.collection("chatRooms").findOne({
          _id: new ObjectId(roomId),
        })

        if (!room) {
          socket.emit("messageError", { error: "Room non trovata" })
          return
        }

        // Crea il messaggio
        const message = {
          roomId: new ObjectId(roomId),
          senderId: senderId,
          senderName: senderName || "Utente",
          senderImage: senderImage || null,
          content: content.trim(),
          createdAt: new Date(),
          readBy: [senderId],
        }

        const result = await db.collection("messages").insertOne(message)

        // Aggiorna la room con l'ultimo messaggio
        await db.collection("chatRooms").updateOne(
          { _id: new ObjectId(roomId) },
          {
            $set: {
              lastMessage: content.trim(),
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            },
          },
        )

        // Prepara il messaggio per l'invio
        const messageToSend = {
          _id: result.insertedId.toString(),
          roomId: roomId,
          senderId: senderId,
          senderName: senderName || "Utente",
          senderImage: senderImage || null,
          content: content.trim(),
          createdAt: message.createdAt.toISOString(),
        }

        // Invia il messaggio a tutti i client nella room
        io.to(roomId).emit("receiveMessage", messageToSend)
        console.log(`Message sent to room ${roomId}:`, messageToSend)
      } catch (error) {
        console.error("Error handling sendMessage:", error)
        socket.emit("messageError", { error: "Errore nell'invio del messaggio" })
      }
    })

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`)
    })
  })

  return io
}
