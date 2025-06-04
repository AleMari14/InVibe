import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { setupWebSocketServer } from "./websocket"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Configura il server WebSocket
  setupWebSocketServer(server)

  const port = parseInt(process.env.PORT || '3000')
  
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`)
  }).on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Please try a different port or close the application using port ${port}.`)
      process.exit(1)
    } else {
      console.error('Server error:', err)
      process.exit(1)
    }
  })
}) 