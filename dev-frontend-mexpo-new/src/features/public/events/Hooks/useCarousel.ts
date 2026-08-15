"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface UseCarouselOptions<T> {
  data: T[];
  itemsPerPage?: number;
  autoplayDelay?: number;
  loop?: boolean;
}

export const useCarousel = <T,>({
  data,
  itemsPerPage = 3,
  autoplayDelay = 5000,
  loop = true,
}: UseCarouselOptions<T>) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // ✅ Autoplay dibuat sekali pakai useRef, tidak re-create setiap render
  const autoplayPlugin = useRef(
    Autoplay({
      delay: autoplayDelay,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop,
      align: "start",
      slidesToScroll: 1,
      containScroll: "trimSnaps",
      breakpoints: {
        "(max-width: 640px)": { slidesToScroll: 1 },
      },
    },
    // eslint-disable-next-line react-hooks/refs -- autoplay plugin ref is stable (created once via useRef)
    [autoplayPlugin.current]
  );

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    onSelect();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  const nextSlide = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const prevSlide = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const goToSlide = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  // ✅ totalSlides dihitung ulang hanya saat data atau itemsPerPage berubah
  const totalSlides = useMemo(
    () => Math.ceil(data.length / itemsPerPage),
    [data.length, itemsPerPage]
  );

  return {
    emblaRef,
    emblaApi,
    currentSlide,
    totalSlides,
    nextSlide,
    prevSlide,
    goToSlide,
    data,
    itemsPerPage,
  };
};