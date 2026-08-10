import { Nav } from "@/components/landing/nav";
import { Hero } from "@/components/landing/hero";
import { Catalogo } from "@/components/landing/catalogo";
import { Nosotros } from "@/components/landing/nosotros";
import { PhotoStrip } from "@/components/landing/photo-strip";
import { Testimonios } from "@/components/landing/testimonios";
import { Contacto } from "@/components/landing/contacto";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-ink">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Catalogo />
        <Nosotros />
        <PhotoStrip />
        <Testimonios />
        <Contacto />
      </main>
      <Footer />
    </div>
  );
}
