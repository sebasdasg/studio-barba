export function Footer() {
  return (
    <footer className="bg-ink-3 px-6 py-16 text-center sm:px-[6vw]">
      <p className="font-display text-2xl tracking-[2px] text-cream">STUDIO BARBA</p>
      <a
        href="/reservar"
        className="mt-6 inline-block rounded-full bg-brass px-7 py-3 text-[13px] font-bold uppercase tracking-[1px] text-ink transition-colors hover:bg-brass-hover"
      >
        Reservar cita
      </a>
      <p className="mt-8 text-xs text-cream/50">© 2026 Studio Barba Barbershop</p>
    </footer>
  );
}
