import { WebSocketServer, WebSocket } from "ws"
import { Server } from "http"
import { parse } from "url"
import { ObjectId } from "mongodb"
import clientPromise from "../lib/mongodb"

interface WebSocketMessage {
  content: string
  roomId: string
  senderId: string
}

class WebSocketClient extends WebSocket {
  userId: string
  roomId: string
  isAlive: boolean

  constructor(address: string, protocols?: string | string[]) {
    super(address, protocols)
    this.userId = ""
    this.roomId = ""
    this.isAlive = true
  }
}

export function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ noServer: true })
  const clients = new Map<string, Set<WebSocketClient>>()

  // Gestione upgrade della connessione HTTP a WebSocket
  server.on("upgrade", async (request, socket, head) => {
    const { query } = parse(request.url!, true)
    const roomId = query.roomId as string
    const userId = query.userId as string

    if (!roomId || !userId) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n")
      socket.destroy()
      return
    }

    // Verifica che l'utente sia autorizzato a partecipare alla chat
    try {
      const client = await clientPromise
      const db = client.db("invibe")
      const chatRoom = await db.collection("chatRooms").findOne({
        _id: new ObjectId(roomId),
        participants: userId
      })

      if (!chatRoom) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n")
        socket.destroy()
        return
      }

      wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
        const client = ws as WebSocketClient
        client.userId = userId
        client.roomId = roomId
        client.isAlive = true

        // Aggiungi il client alla stanza
        if (!clients.has(roomId)) {
          clients.set(roomId, new Set())
        }
        clients.get(roomId)!.add(client)

        wss.emit("connection", client, request)
      })
    } catch (error) {
      console.error("Error during WebSocket upgrade:", error)
      socket.write("HTTP/1.1 500 Internal Server Error\r\n\r\n")
      socket.destroy()
    }
  })

  // Gestione connessioni WebSocket
  wss.on("connection", (ws: WebSocketClient) => {
    console.log(`Client connected to room ${ws.roomId}`)

    // Gestione messaggi
    ws.on("message", async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data)
        const client = await clientPromise
        const db = client.db("invibe")

        // Salva il messaggio nel database
        const result = await db.collection("messages").insertOne({
          roomId: message.roomId,
          content: message.content,
          senderId: message.senderId,
          createdAt: new Date(),
          readBy: [message.senderId]
        })

        // Aggiorna l'ultimo messaggio nella chat room
        await db.collection("chatRooms").updateOne(
          { _id: new ObjectId(message.roomId) },
          {
            $set: {
              lastMessage: {
                content: message.content,
                senderId: message.senderId,
                createdAt: new Date()
              },
              updatedAt: new Date()
            }
          }
        )

        // Invia il messaggio a tutti i client nella stanza
        const roomClients = clients.get(message.roomId)
        if (roomClients) {
          const messageToSend = {
            _id: result.insertedId,
            ...message,
            createdAt: new Date()
          }

          roomClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(messageToSend))
            }
          })
        }
      } catch (error) {
        console.error("Error handling message:", error)
      }
    })

    // Gestione disconnessione
    ws.on("close", () => {
      console.log(`Client disconnected from room ${ws.roomId}`)
      const roomClients = clients.get(ws.roomId)
      if (roomClients) {
        roomClients.delete(ws)
        if (roomClients.size === 0) {
          clients.delete(ws.roomId)
        }
      }
    })

    // Gestione errori
    ws.on("error", (error: Error) => {
      console.error("WebSocket error:", error)
    })
  })

  // Ping per mantenere attive le connessioni
  const interval = setInterval(() => {
    wss.clients.forEach((ws: WebSocket) => {
      const client = ws as WebSocketClient
      if (!client.isAlive) {
        return client.terminate()
      }

      client.isAlive = false
      client.ping()
    })
  }, 30000)

  wss.on("close", () => {
    clearInterval(interval)
  })
}
