import Image from "next/image";
import { cn } from "@/lib/utils";

type PhotoBoxProps = {
  src?: string;
  alt: string;
  label: string;
  aspect: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

// Sin `src` real todavía (fotos del negocio pendientes) — muestra un
// placeholder con la marca de qué foto va ahí. Al llegar la foto real,
// basta con pasar `src` para que se renderice con next/image.
export function PhotoBox({
  src,
  alt,
  label,
  aspect,
  className,
  imgClassName,
  priority,
}: PhotoBoxProps) {
  return (
    <div className={cn("relative overflow-hidden", className)} style={{ aspectRatio: aspect }}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-ink-3 via-ink-2 to-oxblood/30">
          <span className="px-6 text-center text-[11px] uppercase tracking-[0.2em] text-cream/35">
            {label}
          </span>
        </div>
      )}
    </div>
  );
}
