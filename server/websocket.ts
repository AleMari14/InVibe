import type { Server, Socket } from "socket.io"
import clientPromise from "../lib/mongodb"

interface SocketMessage {
  content: string
  roomId: string
  senderId: string
  senderName: string
  senderImage?: string
}

export function setupSocketIO(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Unisciti a una stanza specifica
    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId)
      console.log(`Socket ${socket.id} joined room ${roomId}`)
    })

    // Lascia una stanza
    socket.on("leaveRoom", (roomId: string) => {
      socket.leave(roomId)
      console.log(`Socket ${socket.id} left room ${roomId}`)
    })

    // Gestione dell'invio di un messaggio
    socket.on("sendMessage", async (message: SocketMessage) => {
      try {
        const client = await clientPromise
        const db = client.db("invibe")

        // Salva il messaggio nel database
        const messageDocument = {
          roomId: message.roomId,
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          senderImage: message.senderImage,
          createdAt: new Date(),
          readBy: [message.senderId],
        }

        const result = await db.collection("messages").insertOne(messageDocument)

        // Aggiorna l'ultimo messaggio nella chat room
        await db.collection("chatRooms").updateOne(
          { roomId: message.roomId },
          {
            $set: {
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                createdAt: messageDocument.createdAt,
              },
              updatedAt: new Date(),
            },
          },
        )

        // Prepara il messaggio da inviare ai client
        const messageToSend = {
          _id: result.insertedId.toString(),
          ...messageDocument,
        }

        // Invia il messaggio a tutti i client nella stanza, incluso il mittente
        io.to(message.roomId).emit("receiveMessage", messageToSend)
      } catch (error) {
        console.error("Error handling message:", error)
        // Potresti voler inviare un messaggio di errore al mittente
        socket.emit("messageError", { error: "Failed to send message" })
      }
    })

    // Gestione disconnessione
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}
