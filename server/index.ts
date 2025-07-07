import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server } from "socket.io"
import { setupSocketIO } from "./websocket"

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = process.env.PORT || 3001

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url!, true)
      handle(req, res, parsedUrl)
    } catch (err) {
      console.error("Error handling request:", err)
      res.statusCode = 500
      res.end("internal server error")
    }
  })

  // Inizializza Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // In produzione, dovresti limitarlo al tuo dominio
      methods: ["GET", "POST"],
    },
  })

  // Configura la logica di Socket.IO
  setupSocketIO(io)

  httpServer
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
    .on("error", (err) => {
      console.error("Server error:", err)
      process.exit(1)
    })
})
