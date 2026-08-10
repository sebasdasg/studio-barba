import { PhotoBox } from "./photo-box";

export function Hero() {
  return (
    <section className="relative z-0 flex min-h-screen items-center justify-center px-6 py-20 sm:px-[6vw]">
      <PhotoBox
        src="/images/landing/hero.jpg"
        alt="Interior de Studio Barba"
        label="Foto pendiente: interior del local"
        aspect="auto"
        className="absolute inset-0 -z-10 h-full w-full"
        priority
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,oklch(15%_0.015_55/0.75)_0%,oklch(15%_0.015_55/0.55)_50%,oklch(15%_0.015_55/0.9)_100%)]" />

      <div className="max-w-3xl text-center">
        <div
          className="animate-hero-in mx-auto mb-6 h-[3px] w-[60px] bg-brass"
          style={{ animationDelay: "0s" }}
        />
        <h1
          className="animate-hero-in font-display text-[clamp(56px,10vw,130px)] uppercase leading-[0.95] text-cream"
          style={{ animationDelay: "0.1s" }}
        >
          Estilo clásico.
          <br />
          Actitud moderna.
        </h1>
        <p
          className="animate-hero-in mx-auto mt-6 max-w-[560px] text-lg text-cream/90"
          style={{ animationDelay: "0.28s" }}
        >
          En Studio Barba dominamos tanto el fade limpio de toda la vida como
          los cortes que se ven en la calle hoy. Vení con la idea, salí con el
          corte.
        </p>
        <div
          className="animate-hero-in mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: "0.42s" }}
        >
          <a
            href="/reservar"
            className="rounded-full bg-brass px-7 py-3.5 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
          >
            Reservar cita
          </a>
          <a
            href="#catalogo"
            className="rounded-full border border-ink-border-2 px-7 py-3.5 text-[13px] font-bold uppercase tracking-[1px] text-cream transition-colors hover:border-brass hover:text-brass"
          >
            Ver cortes
          </a>
        </div>
      </div>
    </section>
  );
}
