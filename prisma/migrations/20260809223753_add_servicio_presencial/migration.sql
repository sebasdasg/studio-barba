-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'YAPE', 'PLIN');

-- DropForeignKey
ALTER TABLE "Cita" DROP CONSTRAINT "Cita_clienteId_fkey";

-- AlterTable
ALTER TABLE "Cita" ADD COLUMN     "esPresencial" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "clienteId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Pago" ADD COLUMN     "metodoPago" "MetodoPago",
ALTER COLUMN "urlComprobante" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
