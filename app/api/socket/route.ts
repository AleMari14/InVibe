import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

let io: SocketIOServer;

export async function GET(req: Request) {
  if (!io) {
    io = new SocketIOServer({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', async (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join_room', (roomId: string) => {
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
      });

      socket.on('send_message', async (data) => {
        try {
          const { db } = await connectToDatabase();
          const result = await db.collection('messages').insertOne({
            ...data,
            createdAt: new Date(),
          });
          
          io.to(data.roomId).emit('receive_message', {
            ...data,
            _id: result.insertedId,
            createdAt: new Date(),
          });
        } catch (error) {
          console.error('Error saving message:', error);
        }
      });
    });
  }

  return new NextResponse('WebSocket server is running', { status: 200 });
}

export async function POST(req: Request) {
  return GET(req);
} 