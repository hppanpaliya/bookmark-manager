import { NextRequest } from 'next/server';

// Store active connections
const connections = new Set<WritableStreamDefaultWriter>();

// Helper to broadcast events to all connections
export function broadcastEvent(type: string, data: any) {
  const message = `data: ${JSON.stringify({ type, data })}\n\n`;

  connections.forEach(async (writer) => {
    try {
      await writer.write(new TextEncoder().encode(message));
    } catch (error) {
      // Remove dead connections
      connections.delete(writer);
    }
  });
}

export async function GET(request: NextRequest) {
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const writer = controller;

      // Add this connection to our set
      connections.add(writer as any);

      // Send initial connection message
      const welcome = `data: ${JSON.stringify({
        type: 'connected',
        data: { message: 'SSE connection established' }
      })}\n\n`;

      writer.enqueue(new TextEncoder().encode(welcome));

      // Handle client disconnect
      request.signal?.addEventListener('abort', () => {
        connections.delete(writer as any);
        try {
          controller.close();
        } catch (error) {
          // Controller already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}