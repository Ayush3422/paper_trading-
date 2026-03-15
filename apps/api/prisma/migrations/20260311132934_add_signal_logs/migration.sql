-- AlterTable
ALTER TABLE "Strategy" ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "runCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "StrategySignalLog" (
    "id" TEXT NOT NULL,
    "strategyId" TEXT NOT NULL,
    "strategyName" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "orderPlaced" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StrategySignalLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StrategySignalLog_strategyId_idx" ON "StrategySignalLog"("strategyId");

-- CreateIndex
CREATE INDEX "StrategySignalLog_symbol_idx" ON "StrategySignalLog"("symbol");

-- CreateIndex
CREATE INDEX "StrategySignalLog_timestamp_idx" ON "StrategySignalLog"("timestamp");

-- AddForeignKey
ALTER TABLE "StrategySignalLog" ADD CONSTRAINT "StrategySignalLog_strategyId_fkey" FOREIGN KEY ("strategyId") REFERENCES "Strategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
