-- CreateTable
CREATE TABLE "BarberoHorario" (
    "id" TEXT NOT NULL,
    "barberoId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,

    CONSTRAINT "BarberoHorario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BarberoHorario_barberoId_diaSemana_key" ON "BarberoHorario"("barberoId", "diaSemana");

-- AddForeignKey
ALTER TABLE "BarberoHorario" ADD CONSTRAINT "BarberoHorario_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Barbero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
