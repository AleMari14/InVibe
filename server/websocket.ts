import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import { connectToDatabase } from "../lib/mongodb"
import { ObjectId } from "mongodb"

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NODE_ENV === "production" ? false : ["http://localhost:3000"],
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("joinRoom", (roomId) => {
      console.log(`User ${socket.id} joining room: ${roomId}`)
      socket.join(roomId)
    })

    socket.on("sendMessage", async (messageData) => {
      try {
        const { roomId, senderId, senderName, senderImage, content } = messageData

        if (!roomId || !senderId || !content) {
          socket.emit("messageError", { error: "Dati messaggio incompleti" })
          return
        }

        const { db } = await connectToDatabase()

        // Verifica che la room esista
        const room = await db.collection("chatRooms").findOne({
          _id: new ObjectId(roomId),
          "participants.email": senderId,
        })

        if (!room) {
          socket.emit("messageError", { error: "Room non trovata" })
          return
        }

        // Crea il messaggio
        const message = {
          roomId: new ObjectId(roomId),
          senderId: senderId,
          senderName: senderName,
          senderImage: senderImage,
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

        // Formatta il messaggio per il client
        const formattedMessage = {
          ...message,
          _id: result.insertedId.toString(),
          roomId: roomId,
          createdAt: message.createdAt.toISOString(),
        }

        // Invia il messaggio a tutti i client nella room
        io.to(roomId).emit("receiveMessage", formattedMessage)
      } catch (error) {
        console.error("Error sending message:", error)
        socket.emit("messageError", { error: "Errore nell'invio del messaggio" })
      }
    })

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id)
    })
  })

  return io
}
