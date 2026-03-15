import { Server, Socket } from 'socket.io';
import { marketDataService } from '../services/market-data.service';

const subscribedSymbols = new Map<string, Set<string>>(); // symbol → Set<socketId>
let priceInterval: NodeJS.Timeout | null = null;

export function setupWebSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.on('subscribe:prices', async ({ symbols }: { symbols: string[] }) => {
      if (!Array.isArray(symbols)) return;
      const list = symbols.slice(0, 20).map(s => s.toUpperCase());

      for (const symbol of list) {
        socket.join(`price:${symbol}`);
        if (!subscribedSymbols.has(symbol)) subscribedSymbols.set(symbol, new Set());
        subscribedSymbols.get(symbol)!.add(socket.id);
      }

      // Send immediate current prices
      const quotes = await Promise.all(list.map(s => marketDataService.getQuote(s)));
      socket.emit('prices:snapshot', quotes);
    });

    socket.on('unsubscribe:prices', ({ symbols }: { symbols: string[] }) => {
      if (!Array.isArray(symbols)) return;
      for (const symbol of symbols.map(s => s.toUpperCase())) {
        socket.leave(`price:${symbol}`);
        subscribedSymbols.get(symbol)?.delete(socket.id);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      for (const [, sockets] of subscribedSymbols) {
        sockets.delete(socket.id);
      }
    });
  });

  // Stream price updates every 3 seconds
  if (!priceInterval) {
    priceInterval = setInterval(async () => {
      const activeSymbols = Array.from(subscribedSymbols.entries())
        .filter(([, sockets]) => sockets.size > 0)
        .map(([symbol]) => symbol);

      for (const symbol of activeSymbols) {
        try {
          const quote = await marketDataService.getQuote(symbol);
          io.to(`price:${symbol}`).emit('price:tick', {
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            volume: quote.volume,
            timestamp: Date.now(),
          });
        } catch { /* ignore individual failures */ }
      }
    }, 3000);
  }

  console.log('✅ WebSocket gateway ready');
}
