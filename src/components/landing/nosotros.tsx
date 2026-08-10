import { PhotoBox } from "./photo-box";

const stats = [
  { label: "Navaja", caption: "Acabado a la antigua" },
  { label: "Fade", caption: "Degradado de precisión" },
  { label: "Barba", caption: "Perfilado profesional" },
];

export function Nosotros() {
  return (
    <section id="nosotros" className="bg-cream px-6 py-[120px] text-ink sm:px-[6vw]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 md:grid-cols-2">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[3px] text-oxblood">
            Sobre nosotros
          </p>
          <h2 className="mt-3 font-display text-[clamp(36px,4.5vw,54px)] uppercase leading-[1.02]">
            No elegimos bando entre clásico y moderno
          </h2>
          <p className="mt-5 max-w-[480px] text-[16.5px] text-ink/70">
            Formamos a nuestro equipo tanto en las técnicas de barbería
            tradicional como en las tendencias que se ven hoy en la calle.
            Cada corte se piensa para la forma de tu cara, no solo para
            copiar una foto.
          </p>

          <div className="mt-9 flex gap-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-[30px] leading-none">{stat.label}</p>
                <p className="mt-1.5 text-[13px] text-ink/60">{stat.caption}</p>
              </div>
            ))}
          </div>
        </div>

        <PhotoBox
          src="/images/landing/about.jpg"
          alt="Barbero de Studio Barba trabajando"
          label="Foto pendiente: equipo / barbero en acción"
          aspect="4/3"
          className="rounded"
        />
      </div>
    </section>
  );
}
