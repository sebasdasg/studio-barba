import { z } from "zod";

// Celular peruano: 9 dígitos, empieza con 9.
const celularSchema = z
  .string()
  .trim()
  .regex(/^9\d{8}$/, "Ingresa un celular válido (9 dígitos, empieza con 9).");

export const registroSchema = z.object({
  nombre: z.string().trim().min(2, "Ingresa tu nombre."),
  celular: celularSchema,
  email: z.string().trim().email("Ingresa un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const loginSchema = z.object({
  celular: celularSchema,
  password: z.string().min(1, "Ingresa tu contraseña."),
});
