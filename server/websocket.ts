import { Server as SocketIOServer } from "socket.io"
import type { Server as HTTPServer } from "http"
import clientPromise from "../lib/mongodb"

export function initializeWebSocket(server: HTTPServer) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "https://invibe.vercel.app"],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id)

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId)
      console.log(`User ${socket.id} joined room ${roomId}`)
    })

    socket.on("sendMessage", async (messageData) => {
      try {
        const { roomId, senderId, senderName, senderImage, content } = messageData

        const client = await clientPromise
        const db = client.db("invibe")

        // Salva il messaggio nel database
        const message = {
          roomId,
          senderId,
          senderName,
          senderImage,
          content,
          createdAt: new Date(),
          readBy: [senderId], // Il mittente ha già "letto" il messaggio
        }

        const result = await db.collection("messages").insertOne(message)
        const savedMessage = { ...message, _id: result.insertedId }

        // Invia il messaggio a tutti nella room
        io.to(roomId).emit("receiveMessage", savedMessage)

        // Trova la chat room per ottenere i partecipanti
        const chatRoom = await db.collection("chatRooms").findOne({ _id: roomId })
        if (chatRoom) {
          // Trova il destinatario (l'altro partecipante)
          const recipient = chatRoom.participants.find((p: any) => p.email !== senderId)

          if (recipient) {
            // Crea notifica per il destinatario
            const notification = {
              userId: recipient.email,
              type: "message",
              title: "Nuovo messaggio",
              message: `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
              eventId: chatRoom.eventId,
              fromUserId: senderId,
              fromUserName: senderName,
              read: false,
              createdAt: new Date(),
            }

            await db.collection("notifications").insertOne(notification)

            // Emetti notifica in tempo reale
            io.emit("newNotification", {
              userId: recipient.email,
              notification,
            })
          }
        }

        console.log("Message saved and sent:", savedMessage._id)
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
