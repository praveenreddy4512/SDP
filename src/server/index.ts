import './module-resolver';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeWebSocket } from '@/lib/websocket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

console.log(`Starting server in ${dev ? 'development' : 'production'} mode...`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('Next.js app prepared successfully');

    const server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error('Error occurred handling', req.url, err);
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
    });

    // Initialize WebSocket server
    try {
      initializeWebSocket(server);
      console.log('WebSocket server initialized successfully');
    } catch (err) {
      console.error('Error initializing WebSocket server:', err);
    }

    server.on('error', (err) => {
      console.error('Server error:', err);
    });

    server.listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log('> Press Ctrl+C to stop the server');
    });
  })
  .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  }); 