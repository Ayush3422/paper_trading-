import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const symbols = [
  { ticker:'AAPL', companyName:'Apple Inc.',          exchange:'NASDAQ', sector:'Technology' },
  { ticker:'MSFT', companyName:'Microsoft Corp.',     exchange:'NASDAQ', sector:'Technology' },
  { ticker:'GOOGL',companyName:'Alphabet Inc.',       exchange:'NASDAQ', sector:'Technology' },
  { ticker:'AMZN', companyName:'Amazon.com Inc.',     exchange:'NASDAQ', sector:'Consumer Cyclical' },
  { ticker:'META', companyName:'Meta Platforms Inc.', exchange:'NASDAQ', sector:'Technology' },
  { ticker:'TSLA', companyName:'Tesla Inc.',          exchange:'NASDAQ', sector:'Consumer Cyclical' },
  { ticker:'NVDA', companyName:'NVIDIA Corp.',        exchange:'NASDAQ', sector:'Technology' },
  { ticker:'NFLX', companyName:'Netflix Inc.',        exchange:'NASDAQ', sector:'Communication' },
  { ticker:'JPM',  companyName:'JPMorgan Chase & Co.',exchange:'NYSE',   sector:'Financial' },
  { ticker:'V',    companyName:'Visa Inc.',           exchange:'NYSE',   sector:'Financial' },
  { ticker:'JNJ',  companyName:'Johnson & Johnson',   exchange:'NYSE',   sector:'Healthcare' },
  { ticker:'WMT',  companyName:'Walmart Inc.',        exchange:'NYSE',   sector:'Consumer Defensive' },
  { ticker:'DIS',  companyName:'Walt Disney Co.',     exchange:'NYSE',   sector:'Communication' },
  { ticker:'MA',   companyName:'Mastercard Inc.',     exchange:'NYSE',   sector:'Financial' },
  { ticker:'PG',   companyName:'Procter & Gamble Co.',exchange:'NYSE',   sector:'Consumer Defensive' },
  { ticker:'BAC',  companyName:'Bank of America',     exchange:'NYSE',   sector:'Financial' },
  { ticker:'HD',   companyName:'Home Depot Inc.',     exchange:'NYSE',   sector:'Consumer Cyclical' },
  { ticker:'XOM',  companyName:'Exxon Mobil Corp.',   exchange:'NYSE',   sector:'Energy' },
  { ticker:'CVX',  companyName:'Chevron Corp.',       exchange:'NYSE',   sector:'Energy' },
  { ticker:'ABBV', companyName:'AbbVie Inc.',         exchange:'NYSE',   sector:'Healthcare' },
  { ticker:'SPY',  companyName:'SPDR S&P 500 ETF',    exchange:'NYSE',   sector:'ETF' },
  { ticker:'QQQ',  companyName:'Invesco QQQ Trust',   exchange:'NASDAQ', sector:'ETF' },
  { ticker:'AMD',  companyName:'Advanced Micro Devices',exchange:'NASDAQ',sector:'Technology' },
  { ticker:'INTC', companyName:'Intel Corp.',         exchange:'NASDAQ', sector:'Technology' },
  { ticker:'CRM',  companyName:'Salesforce Inc.',     exchange:'NYSE',   sector:'Technology' },
];

const achievements = [
  { code:'FIRST_TRADE',   name:'First Steps',     description:'Execute your first paper trade',   iconEmoji:'🎯', points:10 },
  { code:'FIRST_PROFIT',  name:'First Profit',    description:'Close a position in profit',        iconEmoji:'💰', points:25 },
  { code:'TEN_TRADES',    name:'Getting Started', description:'Complete 10 trades',                iconEmoji:'📈', points:50 },
  { code:'HUNDRED_TRADES',name:'Active Trader',   description:'Complete 100 trades',               iconEmoji:'⚡', points:100 },
  { code:'RETURN_10',     name:'Growing',         description:'Achieve 10% portfolio return',      iconEmoji:'🌱', points:50 },
  { code:'RETURN_50',     name:'Skilled',         description:'Achieve 50% portfolio return',      iconEmoji:'🔥', points:150 },
  { code:'RETURN_100',    name:'Master Trader',   description:'Double your portfolio',             iconEmoji:'👑', points:500 },
  { code:'NO_LOSS_WEEK',  name:'Perfect Week',    description:'7 days without a losing trade',     iconEmoji:'🛡️', points:75 },
  { code:'DIVERSIFIED',   name:'Diversified',     description:'Hold 5+ different stocks',          iconEmoji:'🎨', points:30 },
];

async function main() {
  console.log('🌱 Seeding database...');
  for (const s of symbols) {
    await prisma.symbol.upsert({ where:{ticker:s.ticker}, update:s, create:s });
  }
  for (const a of achievements) {
    await prisma.achievement.upsert({ where:{code:a.code}, update:a, create:a });
  }
  console.log(`✅ Seeded ${symbols.length} symbols and ${achievements.length} achievements`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
