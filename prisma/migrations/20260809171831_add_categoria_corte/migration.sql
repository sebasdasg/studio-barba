-- AlterTable
ALTER TABLE "Corte" ADD COLUMN     "categoriaCorteId" TEXT;

-- CreateTable
CREATE TABLE "CategoriaCorte" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoriaCorte_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Corte" ADD CONSTRAINT "Corte_categoriaCorteId_fkey" FOREIGN KEY ("categoriaCorteId") REFERENCES "CategoriaCorte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
