import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { get } from "@vercel/blob";

// Sirve el comprobante de pago (archivo privado en Vercel Blob) solo a
// administradores. El cliente nunca ve la URL real del blob ni el token —
// esta ruta hace de intermediaria: valida el rol, busca el Pago en la
// base, y transmite el archivo directo desde el storage.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ pagoId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.rol !== "ADMIN") {
    return new Response("No autorizado", { status: 403 });
  }

  const { pagoId } = await params;
  const pago = await prisma.pago.findUnique({ where: { id: pagoId } });
  if (!pago || !pago.urlComprobante) {
    return new Response("No encontrado", { status: 404 });
  }

  const resultado = await get(pago.urlComprobante, { access: "private" });
  if (!resultado || resultado.statusCode !== 200) {
    return new Response("No se pudo cargar el comprobante", { status: 404 });
  }

  return new Response(resultado.stream, {
    headers: {
      "content-type": resultado.blob.contentType,
      "cache-control": "private, no-store",
    },
  });
}
