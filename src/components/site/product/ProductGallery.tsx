import { useState, lazy, Suspense } from "react";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import "yet-another-react-lightbox/styles.css";

const Lightbox = lazy(() => import("yet-another-react-lightbox"));

export function ProductGallery({ images, alt }: { images: { url: string }[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="aspect-square grid place-items-center rounded-2xl border border-border bg-primary-light text-6xl">
        🪟
      </div>
    );
  }

  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);
  const next = () => setActive((i) => (i + 1) % images.length);

  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) (dx > 0 ? prev : next)();
    setTouchStartX(null);
  };

  return (
    <div>
      <div
        className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-soft"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="block w-full"
          aria-label="Zoom"
        >
          <img
            src={images[active].url}
            alt={alt}
            className="h-full max-h-[520px] w-full object-contain bg-white"
          />
        </button>
        <span className="absolute top-3 end-3 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="h-4 w-4" />
        </span>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute top-1/2 start-2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground shadow-soft hover:bg-white"
              aria-label="Previous"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute top-1/2 end-2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-foreground shadow-soft hover:bg-white"
              aria-label="Next"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.url + i}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                active === i ? "border-primary" : "border-border",
              )}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {open && (
        <Suspense fallback={null}>
          <Lightbox
            open={open}
            close={() => setOpen(false)}
            index={active}
            on={{ view: ({ index }) => setActive(index) }}
            slides={images.map((i) => ({ src: i.url }))}
          />
        </Suspense>
      )}
    </div>
  );
}
