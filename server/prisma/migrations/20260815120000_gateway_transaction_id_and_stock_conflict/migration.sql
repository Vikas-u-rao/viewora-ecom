-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'paid_stock_conflict';

-- AlterTable
ALTER TABLE "payments" RENAME COLUMN "phonepe_transaction_id" TO "gateway_transaction_id";
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'phonepe';

-- RenameIndex
ALTER INDEX IF EXISTS "payments_phonepe_transaction_id_key" RENAME TO "payments_gateway_transaction_id_key";
