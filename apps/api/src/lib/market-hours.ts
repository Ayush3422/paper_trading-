export interface MarketStatus {
  open: boolean;
  session: 'pre-market' | 'regular' | 'after-hours' | 'closed';
  nextOpen?: Date;
  nextClose?: Date;
  message: string;
}

export function getMarketStatus(): MarketStatus {
  const now = new Date();
  const nyOffset = getNYOffset(now);
  const nyTime = new Date(now.getTime() + nyOffset * 60 * 60 * 1000);
  const day = nyTime.getUTCDay(); // 0=Sun, 6=Sat
  const hour = nyTime.getUTCHours();
  const min = nyTime.getUTCMinutes();
  const timeNum = hour * 100 + min;

  if (day === 0 || day === 6) {
    return { open: false, session: 'closed', message: 'Market closed (weekend)' };
  }
  if (timeNum >= 400 && timeNum < 930) {
    return { open: false, session: 'pre-market', message: 'Pre-market hours (4:00–9:30 AM ET)' };
  }
  if (timeNum >= 930 && timeNum < 1600) {
    return { open: true, session: 'regular', message: 'Market open (9:30 AM–4:00 PM ET)' };
  }
  if (timeNum >= 1600 && timeNum < 2000) {
    return { open: false, session: 'after-hours', message: 'After-hours (4:00–8:00 PM ET)' };
  }
  return { open: false, session: 'closed', message: 'Market closed' };
}

function getNYOffset(date: Date): number {
  const jan = new Date(date.getFullYear(), 0, 1);
  const jul = new Date(date.getFullYear(), 6, 1);
  const isDST = date.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
  return isDST ? -4 : -5;
}
