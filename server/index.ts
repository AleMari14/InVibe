import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server } from "socket.io"
import { setupSocketIO } from "./websocket"

const dev = process.env.NODE_ENV !== "production"
const port = Number.parseInt(process.env.PORT || "3001", 10)

const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Per produzione, limita al tuo dominio es: "https://in-vibe.vercel.app"
      methods: ["GET", "POST"],
    },
  })

  setupSocketIO(io)

  httpServer.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port}`)
  })
})
