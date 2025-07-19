import { Server } from 'socket.io'

let io: Server | null = null

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXTAUTH_URL,
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    console.log('New client connected')

    socket.on('disconnect', () => {
      console.log('Client disconnected')
    })

    socket.on('file:change', (data) => {
      socket.broadcast.emit('file:update', data)
    })

    socket.on('terminal:command', (data) => {
      socket.broadcast.emit('terminal:output', data)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}
