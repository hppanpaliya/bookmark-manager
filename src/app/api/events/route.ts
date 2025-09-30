import { NextRequest } from 'next/server';

// Store active connections with proper typing
const connections = new Set<ReadableStreamDefaultController>();

// Helper to broadcast events to all connections
export function broadcastEvent(type: string, data: unknown) {
  const message = `data: ${JSON.stringify({ type, data })}\n\n`;

  connections.forEach((controller) => {
    try {
      controller.enqueue(new TextEncoder().encode(message));
    } catch {
      // Remove dead connections on error
      connections.delete(controller);
    }
  });
}

export const config = {
  maxDuration: 3600, // 1 hour
};

export async function GET(request: NextRequest) {
  // Create a TransformStream for proper SSE handling
  const stream = new ReadableStream({
    start(controller) {
      // Add this connection to our set
      connections.add(controller);

      // Send initial connection message
      const welcome = `data: ${JSON.stringify({
        type: 'connected',
        data: { message: 'SSE connection established' }
      })}\n\n`;

      controller.enqueue(new TextEncoder().encode(welcome));

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': ping\n\n'));
        } catch {
          // Connection closed, clear interval
          clearInterval(pingInterval);
        }
      }, 30000); // every 30 seconds

      // Handle client disconnect
      request.signal?.addEventListener('abort', () => {
        connections.delete(controller);
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch {
          // Controller already closed
        }
      });
    },
    pull() {
      // Keep the stream alive by doing nothing
      // This prevents the stream from completing
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