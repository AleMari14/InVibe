import { createServer } from "http"
import { initializeWebSocket } from "./websocket"

const server = createServer()
const io = initializeWebSocket(server)

const PORT = process.env.WS_PORT || 3001

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`)
})

export { io }
