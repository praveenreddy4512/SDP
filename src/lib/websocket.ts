import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { parse } from 'url';
import { getAnalyticsData } from '../utils/analytics';

interface WebSocketClient extends WebSocket {
  isAlive: boolean;
  reconnectAttempts: number;
}

let wss: WebSocketServer;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL = 5000; // 5 seconds
const PING_INTERVAL = 30000; // 30 seconds

export function initializeWebSocket(server: Server) {
  wss = new WebSocketServer({ noServer: true });

  // Set up ping interval to check client connections
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = ws as WebSocketClient;
      if (!client.isAlive) {
        client.terminate();
        return;
      }
      client.isAlive = false;
      client.ping();
    });
  }, PING_INTERVAL);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '');

    if (pathname === '/api/ws/analytics') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws: WebSocket, request) => {
    const client = ws as WebSocketClient;
    console.log('Client connected to analytics WebSocket');
    
    // Initialize client state
    client.isAlive = true;
    client.reconnectAttempts = 0;
    
    // Send initial data
    sendAnalyticsUpdate(client);

    // Set up periodic updates
    const interval = setInterval(() => {
      sendAnalyticsUpdate(client);
    }, 30000); // Update every 30 seconds

    client.on('pong', () => {
      client.isAlive = true;
    });

    client.on('error', (error) => {
      console.error('WebSocket error:', error);
      handleClientError(client);
    });

    client.on('close', () => {
      clearInterval(interval);
      console.log('Client disconnected from analytics WebSocket');
    });
  });
}

async function sendAnalyticsUpdate(ws: WebSocketClient) {
  try {
    const analyticsData = await getAnalyticsData();

    // Send update to client
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'analytics_update',
        data: analyticsData
      }));
    }
  } catch (error) {
    console.error('Error sending analytics update:', error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to update analytics'
      }));
    }
    handleClientError(ws);
  }
}

function handleClientError(ws: WebSocketClient) {
  if (ws.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    ws.reconnectAttempts++;
    console.log(`Attempting to reconnect client (attempt ${ws.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
    setTimeout(() => {
      if (ws.readyState === WebSocket.CLOSED) {
        // Attempt to reconnect
        ws.terminate();
      }
    }, RECONNECT_INTERVAL);
  } else {
    console.log('Max reconnection attempts reached, closing connection');
    ws.terminate();
  }
}

export function broadcastAnalyticsUpdate() {
  if (!wss) return;
  
  wss.clients.forEach((ws) => {
    const client = ws as WebSocketClient;
    if (client.readyState === WebSocket.OPEN) {
      sendAnalyticsUpdate(client);
    }
  });
} 