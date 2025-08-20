import express from "express"
import { createServer } from "http"
import { initializeWebSocket } from "./websocket"

const app = express()
const server = createServer(app)

// Inizializza WebSocket
const io = initializeWebSocket(server)

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

export { io }
