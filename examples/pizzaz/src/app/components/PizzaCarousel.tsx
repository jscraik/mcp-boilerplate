import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import markersData from "../data/markers.json";
import { PlaceCard } from "./carousel/PlaceCard";

import "../index.css";

export function PizzaCarousel() {
  const places = markersData?.places || [];
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "center",
    loop: false,
    containScroll: "trimSnaps",
    slidesToScroll: "auto",
    dragFree: false,
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    const updateButtons = () => {
      setCanPrev(emblaApi.canScrollPrev());
      setCanNext(emblaApi.canScrollNext());
    };
    updateButtons();
    emblaApi.on("select", updateButtons);
    emblaApi.on("reInit", updateButtons);
    return () => {
      emblaApi.off("select", updateButtons);
      emblaApi.off("reInit", updateButtons);
    };
  }, [emblaApi]);

  return (
    <div className="antialiased relative w-full text-black py-5 bg-white">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 max-sm:mx-5 items-stretch">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </div>
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 left-0 w-32 z-[5] transition-opacity" +
          (canPrev
            ? " bg-gradient-to-r from-white to-transparent"
            : " opacity-0")
        }
      />
      <div
        aria-hidden
        className={
          "pointer-events-none absolute inset-y-0 right-0 w-32 z-[5] transition-opacity" +
          (canNext
            ? " bg-gradient-to-l from-white to-transparent"
            : " opacity-0")
        }
      />
      {canPrev && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollPrev()}
          className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white active:scale-95 transition-transform"
          aria-label="Previous"
        >
          <ArrowLeft className="h-5 w-5 text-black" />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => emblaApi?.scrollNext()}
          className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-lg hover:bg-white active:scale-95 transition-transform"
          aria-label="Next"
        >
          <ArrowRight className="h-5 w-5 text-black" />
        </button>
      )}
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <PizzaCarousel />
    </StrictMode>
  );
}
