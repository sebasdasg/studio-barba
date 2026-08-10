import { PhotoBox } from "./photo-box";

const fotos = [
  "/images/landing/ambiente-1.jpg",
  "/images/landing/ambiente-2.jpg",
  "/images/landing/ambiente-3.jpg",
  "/images/landing/ambiente-4.jpg",
];

export function PhotoStrip() {
  return (
    <section className="grid grid-cols-2 gap-1 sm:grid-cols-4">
      {fotos.map((src) => (
        <PhotoBox
          key={src}
          src={src}
          alt="Ambiente de Studio Barba"
          label="Foto pendiente: ambiente"
          aspect="3/4"
        />
      ))}
    </section>
  );
}
