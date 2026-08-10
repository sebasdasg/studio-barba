import { PhotoBox } from "./photo-box";

const horario = [
  { dia: "Lunes a viernes", horas: "9:00 – 20:00" },
  { dia: "Sábado y domingo", horas: "10:00 – 22:00" },
];

const redes = ["IG", "TT", "FB"];

export function Contacto() {
  return (
    <section id="contacto" className="bg-ink px-6 py-[120px] sm:px-[6vw]">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-16 md:grid-cols-2">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[3px] text-brass">
            Visítanos
          </p>
          <h2 className="mt-3 font-display text-[clamp(36px,4.5vw,54px)] uppercase text-cream">
            Ubicación y horario
          </h2>
          <p className="mt-5 text-[16.5px] text-cream/80">
            Av. José Granda 3402, San Martín de Porres, Lima
          </p>

          <table className="mt-7 w-full max-w-[360px] text-[14.5px] text-cream/80">
            <tbody>
              {horario.map((h) => (
                <tr key={h.dia} className="border-t border-ink-border">
                  <td className="py-2.5 pr-4">{h.dia}</td>
                  <td className="py-2.5 text-right font-medium text-cream">{h.horas}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 flex gap-3">
            {redes.map((red) => (
              <span
                key={red}
                title="Enlace pendiente"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-border-2 text-[11px] font-bold text-cream/70"
              >
                {red}
              </span>
            ))}
          </div>
        </div>

        <PhotoBox
          src="/images/landing/ubicacion.jpg"
          alt="Studio Barba"
          label="Foto pendiente: fachada / ubicación"
          aspect="4/3"
          className="rounded"
        />
      </div>
    </section>
  );
}
