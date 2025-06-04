import { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { NextApiResponse } from "next"

export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer
    }
  }
}

export const initSocket = (res: NextApiResponseWithSocket) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socket",
      addTrailingSlash: false,
    })

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id)

      // Gestione delle stanze di chat
      socket.on("join_room", (roomId: string) => {
        socket.join(roomId)
        console.log(`User ${socket.id} joined room ${roomId}`)
      })

      socket.on("leave_room", (roomId: string) => {
        socket.leave(roomId)
        console.log(`User ${socket.id} left room ${roomId}`)
      })

      // Gestione dei messaggi
      socket.on("send_message", async (data) => {
        const { roomId, message, senderId, receiverId } = data

        // Salva il messaggio nel database
        try {
          const { db } = await import("./mongodb").then(m => m.connectToDatabase())
          await db.collection("messages").insertOne({
            roomId,
            senderId,
            receiverId,
            content: message,
            createdAt: new Date(),
          })

          // Invia il messaggio a tutti gli utenti nella stanza
          io.to(roomId).emit("receive_message", {
            roomId,
            senderId,
            content: message,
            createdAt: new Date(),
          })
        } catch (error) {
          console.error("Error saving message:", error)
        }
      })

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id)
      })
    })

    res.socket.server.io = io
  }
  return res.socket.server.io
} 