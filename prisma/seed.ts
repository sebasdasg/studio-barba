import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const sede = await prisma.sede.upsert({
    where: { id: "sede-principal" },
    update: {
      nombre: "Studio Barba",
      direccion: "Av. José Granda 3402, San Martín de Porres, Lima",
    },
    create: {
      id: "sede-principal",
      nombre: "Studio Barba",
      direccion: "Av. José Granda 3402, San Martín de Porres, Lima",
    },
  });

  // 0 = domingo ... 6 = sábado
  const horarios = [
    { diaSemana: 0, horaInicio: "10:00", horaFin: "22:00" },
    { diaSemana: 1, horaInicio: "09:00", horaFin: "20:00" },
    { diaSemana: 2, horaInicio: "09:00", horaFin: "20:00" },
    { diaSemana: 3, horaInicio: "09:00", horaFin: "20:00" },
    { diaSemana: 4, horaInicio: "09:00", horaFin: "20:00" },
    { diaSemana: 5, horaInicio: "09:00", horaFin: "20:00" },
    { diaSemana: 6, horaInicio: "10:00", horaFin: "22:00" },
  ];
  for (const h of horarios) {
    await prisma.horarioAtencion.upsert({
      where: { sedeId_diaSemana: { sedeId: sede.id, diaSemana: h.diaSemana } },
      update: { horaInicio: h.horaInicio, horaFin: h.horaFin },
      create: { sedeId: sede.id, ...h },
    });
  }

  const cortesData = [
    {
      key: "frances",
      nombre: "Corte Francés",
      categoria: "moderno",
      precio: 35,
      descripcion:
        "Parte superior corta y texturizada con flequillo desordenado sobre la frente. Moderno y atrevido.",
      fotoUrl: "/images/cortes/corte-frances.webp",
    },
    {
      key: "pompadour",
      nombre: "Pompadour Moderno",
      categoria: "moderno",
      precio: 40,
      descripcion:
        "Volumen arriba peinado hacia atrás, laterales cortos con fade. Elegante y con carácter.",
      fotoUrl: "/images/cortes/pompadour-moderno.webp",
    },
    {
      key: "rapado",
      nombre: "Corte Rapado",
      categoria: "clasico",
      precio: 25,
      descripcion:
        "Cabello muy corto y uniforme a máquina. Minimalista, limpio y fácil de mantener.",
      fotoUrl: "/images/cortes/corte-rapado.webp",
    },
    {
      key: "texturizado",
      nombre: "Texturizado con Flequillo",
      categoria: "moderno",
      precio: 35,
      descripcion:
        "Capas con movimiento y flequillo irregular. Desenfadado, juvenil y versátil.",
      fotoUrl: "/images/cortes/texturizado-flequillo.webp",
    },
    {
      key: "fade",
      nombre: "Fade Clásico",
      categoria: "clasico",
      precio: 30,
      descripcion:
        "Transición progresiva de largo, corto en nuca y laterales. El acabado más versátil de todos.",
      fotoUrl: "/images/cortes/fade-clasico.webp",
    },
  ];

  const cortes: Record<string, { id: string }> = {};
  for (const c of cortesData) {
    cortes[c.key] = await prisma.corte.upsert({
      where: { id: `corte-${c.key}` },
      update: {
        nombre: c.nombre,
        precio: c.precio,
        descripcion: c.descripcion,
        categoria: c.categoria,
        fotoUrl: c.fotoUrl,
      },
      create: {
        id: `corte-${c.key}`,
        nombre: c.nombre,
        descripcion: c.descripcion,
        precio: c.precio,
        categoria: c.categoria,
        fotoUrl: c.fotoUrl,
      },
    });
  }

  const adicionalesData = [
    { key: "cejas", nombre: "Perfilado de cejas", precio: 5 },
    { key: "barba", nombre: "Corte y perfilado de barba", precio: 5 },
    { key: "bigote", nombre: "Perfilado de bigote", precio: 5 },
    { key: "lavado", nombre: "Lavado", precio: 8 },
  ];
  for (const a of adicionalesData) {
    await prisma.adicional.upsert({
      where: { id: `adicional-${a.key}` },
      update: { nombre: a.nombre, precio: a.precio },
      create: { id: `adicional-${a.key}`, nombre: a.nombre, precio: a.precio },
    });
  }

  // 3 barberos de prueba con distinta cobertura de cortes, para poder
  // probar el filtro C3 (cliente elige corte -> barberos que lo hacen).
  const passwordDemo = await bcrypt.hash("Demo1234", 10);
  const barberosData = [
    {
      nombre: "Barbero Demo 1",
      celular: "900000001",
      comision: 75,
      cortes: ["frances", "pompadour", "rapado", "texturizado", "fade"],
    },
    {
      nombre: "Barbero Demo 2",
      celular: "900000002",
      comision: 80,
      cortes: ["frances", "pompadour", "texturizado"],
    },
    {
      nombre: "Barbero Demo 3",
      celular: "900000003",
      comision: 85,
      cortes: ["rapado", "fade"],
    },
  ];

  for (const b of barberosData) {
    const user = await prisma.user.upsert({
      where: { celular: b.celular },
      update: { nombre: b.nombre, rol: "BARBERO" },
      create: {
        nombre: b.nombre,
        celular: b.celular,
        passwordHash: passwordDemo,
        rol: "BARBERO",
      },
    });

    const barbero = await prisma.barbero.upsert({
      where: { userId: user.id },
      update: { comisionPorcentaje: b.comision, sedeId: sede.id },
      create: { userId: user.id, sedeId: sede.id, comisionPorcentaje: b.comision },
    });

    for (const corteKey of b.cortes) {
      await prisma.barberoCorte.upsert({
        where: {
          barberoId_corteId: { barberoId: barbero.id, corteId: cortes[corteKey].id },
        },
        update: {},
        create: { barberoId: barbero.id, corteId: cortes[corteKey].id },
      });
    }

    // Horario propio por defecto: igual al de la sede, para que la
    // disponibilidad no quede vacía hasta que cada barbero ajuste el suyo.
    for (const h of horarios) {
      await prisma.barberoHorario.upsert({
        where: { barberoId_diaSemana: { barberoId: barbero.id, diaSemana: h.diaSemana } },
        update: { horaInicio: h.horaInicio, horaFin: h.horaFin },
        create: { barberoId: barbero.id, ...h },
      });
    }
  }

  // Admin de prueba, necesario para poder entrar al futuro panel de administración.
  await prisma.user.upsert({
    where: { celular: "900000000" },
    update: { nombre: "Admin Demo", rol: "ADMIN" },
    create: {
      nombre: "Admin Demo",
      celular: "900000000",
      passwordHash: passwordDemo,
      rol: "ADMIN",
    },
  });

  console.log("Seed completado.");
  console.log("Login de prueba (celular / contraseña, todos con Demo1234):");
  console.log("  900000000 -> Admin Demo");
  console.log("  900000001 -> Barbero Demo 1 (75%, hace los 5 cortes)");
  console.log("  900000002 -> Barbero Demo 2 (80%, francés/pompadour/texturizado)");
  console.log("  900000003 -> Barbero Demo 3 (85%, rapado/fade)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
