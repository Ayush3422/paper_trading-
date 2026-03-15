import { io, Socket } from 'socket.io-client';
import { useMarketStore } from '../store/market.store';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      useMarketStore.getState().setConnected(true);
      console.log('🔌 WebSocket connected');
    });

    socket.on('disconnect', () => {
      useMarketStore.getState().setConnected(false);
    });

    socket.on('price:tick', (tick) => {
      useMarketStore.getState().updatePrice(tick);
    });

    socket.on('prices:snapshot', (quotes: any[]) => {
      quotes.forEach(q => useMarketStore.getState().updatePrice({
        symbol: q.symbol, price: q.price, change: q.change,
        changePercent: q.changePercent, volume: q.volume, timestamp: q.timestamp,
      }));
    });
  }
  return socket;
}

export function subscribeToSymbols(symbols: string[]) {
  const s = getSocket();
  if (!s.connected) s.connect();
  s.emit('subscribe:prices', { symbols });
}

export function unsubscribeFromSymbols(symbols: string[]) {
  getSocket().emit('unsubscribe:prices', { symbols });
}
