-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CLIENTE', 'BARBERO', 'ADMIN');

-- CreateEnum
CREATE TYPE "EstadoBarberoCita" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA', 'ASIGNADA_POR_ADMIN');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('SIN_COMPROBANTE', 'PENDIENTE_VALIDACION', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "EstadoCita" AS ENUM ('RESERVADA', 'CONFIRMADA', 'REQUIERE_ADMIN', 'COMPLETADA', 'NO_SHOW', 'CANCELADA', 'REPROGRAMADA');

-- CreateEnum
CREATE TYPE "TipoPago" AS ENUM ('ADELANTO', 'TOTAL');

-- CreateEnum
CREATE TYPE "EstadoIntento" AS ENUM ('OFRECIDO', 'ACEPTADO', 'RECHAZADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoBloqueo" AS ENUM ('DESCANSO', 'ALMUERZO', 'IMPREVISTO');

-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('WEB', 'EMAIL');

-- CreateEnum
CREATE TYPE "EstadoPenalidad" AS ENUM ('PENDIENTE', 'APLICADA');

-- CreateTable
CREATE TABLE "Sede" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sede_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HorarioAtencion" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "diaSemana" INTEGER NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,

    CONSTRAINT "HorarioAtencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "celular" TEXT,
    "passwordHash" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'CLIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Barbero" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "comisionPorcentaje" DECIMAL(5,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Barbero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Corte" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "fotoUrl" TEXT,
    "categoria" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Corte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarberoCorte" (
    "barberoId" TEXT NOT NULL,
    "corteId" TEXT NOT NULL,

    CONSTRAINT "BarberoCorte_pkey" PRIMARY KEY ("barberoId","corteId")
);

-- CreateTable
CREATE TABLE "Adicional" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Adicional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BloqueoHorario" (
    "id" TEXT NOT NULL,
    "barberoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "tipo" "TipoBloqueo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BloqueoHorario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cita" (
    "id" TEXT NOT NULL,
    "sedeId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "corteId" TEXT NOT NULL,
    "precioCorte" DECIMAL(10,2) NOT NULL,
    "barberoId" TEXT,
    "barberoSegundaOpcionId" TEXT,
    "segundaOpcionAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "asignacionAutomatica" BOOLEAN NOT NULL DEFAULT false,
    "fecha" DATE NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "estado" "EstadoCita" NOT NULL DEFAULT 'RESERVADA',
    "estadoBarbero" "EstadoBarberoCita" NOT NULL DEFAULT 'PENDIENTE',
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'SIN_COMPROBANTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitaAdicional" (
    "citaId" TEXT NOT NULL,
    "adicionalId" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "CitaAdicional_pkey" PRIMARY KEY ("citaId","adicionalId")
);

-- CreateTable
CREATE TABLE "IntentoAsignacion" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "barberoId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "estado" "EstadoIntento" NOT NULL DEFAULT 'OFRECIDO',
    "ofrecidoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondidoEn" TIMESTAMP(3),
    "esAsignacionAdmin" BOOLEAN NOT NULL DEFAULT false,
    "asignadoPorId" TEXT,

    CONSTRAINT "IntentoAsignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "citaId" TEXT NOT NULL,
    "tipo" "TipoPago" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "urlComprobante" TEXT NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE_VALIDACION',
    "validadoPorId" TEXT,
    "validadoEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Penalidad" (
    "id" TEXT NOT NULL,
    "citaOrigenId" TEXT NOT NULL,
    "montoPenalidad" DECIMAL(10,2) NOT NULL,
    "montoDescontadoAdelanto" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldoPendiente" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "citaDestinoId" TEXT,
    "estado" "EstadoPenalidad" NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penalidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "leido" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HorarioAtencion_sedeId_diaSemana_key" ON "HorarioAtencion"("sedeId", "diaSemana");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_celular_key" ON "User"("celular");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Barbero_userId_key" ON "Barbero"("userId");

-- AddForeignKey
ALTER TABLE "HorarioAtencion" ADD CONSTRAINT "HorarioAtencion_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barbero" ADD CONSTRAINT "Barbero_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Barbero" ADD CONSTRAINT "Barbero_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarberoCorte" ADD CONSTRAINT "BarberoCorte_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Barbero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarberoCorte" ADD CONSTRAINT "BarberoCorte_corteId_fkey" FOREIGN KEY ("corteId") REFERENCES "Corte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BloqueoHorario" ADD CONSTRAINT "BloqueoHorario_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Barbero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_sedeId_fkey" FOREIGN KEY ("sedeId") REFERENCES "Sede"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_corteId_fkey" FOREIGN KEY ("corteId") REFERENCES "Corte"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Barbero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cita" ADD CONSTRAINT "Cita_barberoSegundaOpcionId_fkey" FOREIGN KEY ("barberoSegundaOpcionId") REFERENCES "Barbero"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitaAdicional" ADD CONSTRAINT "CitaAdicional_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitaAdicional" ADD CONSTRAINT "CitaAdicional_adicionalId_fkey" FOREIGN KEY ("adicionalId") REFERENCES "Adicional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoAsignacion" ADD CONSTRAINT "IntentoAsignacion_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoAsignacion" ADD CONSTRAINT "IntentoAsignacion_barberoId_fkey" FOREIGN KEY ("barberoId") REFERENCES "Barbero"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntentoAsignacion" ADD CONSTRAINT "IntentoAsignacion_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_citaId_fkey" FOREIGN KEY ("citaId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalidad" ADD CONSTRAINT "Penalidad_citaOrigenId_fkey" FOREIGN KEY ("citaOrigenId") REFERENCES "Cita"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Penalidad" ADD CONSTRAINT "Penalidad_citaDestinoId_fkey" FOREIGN KEY ("citaDestinoId") REFERENCES "Cita"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
