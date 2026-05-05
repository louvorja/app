import { ref, computed, type Ref, type ComputedRef } from "vue";
import { useBroadcastListener } from "@/composables/useBroadcastListener";
import { BROADCAST_TYPE } from "@/helpers/BroadcastTypes";

export type Slide = Record<string, unknown> | null;

export const IMAGE_POSITION_MAP: Record<string | number, string> = {
  center: "center center",
  top:    "center top",
  bottom: "center bottom",
  left:   "left center",
  right:  "right center",
  1: "left top",    2: "center top",    3: "right top",
  4: "left center", 5: "center center", 6: "right center",
  7: "left bottom", 8: "center bottom", 9: "right bottom",
};

export const COLOR_COVER_GOLD  = "#EFB400";
export const COLOR_LYRIC_WHITE = "#FFFFFF";

interface BgImgStyle {
  backgroundImage?: string;
  backgroundSize: string;
  backgroundPosition: string;
}

interface ProjectionStateReturn {
  slide: Ref<Slide>;
  nextSlide: Ref<Slide>;
  title: Ref<string>;
  progress: Ref<number>;
  slideIndex: Ref<number>;
  totalSlides: Ref<number>;
  isCover: ComputedRef<boolean>;
  bgImgStyle: ComputedRef<BgImgStyle>;
}

/**
 * Estado reativo compartilhado entre as views de projeção.
 * Encapsula a subscrição ao SLIDE_CHANGE e os computed derivados comuns.
 */
export function useProjectionState(): ProjectionStateReturn {
  const slide       = ref<Slide>(null);
  const nextSlide   = ref<Slide>(null);
  const title       = ref("");
  const progress    = ref(0);
  const slideIndex  = ref(0);
  const totalSlides = ref(0);

  useBroadcastListener(BROADCAST_TYPE.SLIDE_CHANGE, (payload) => {
    const p = payload as Record<string, unknown>;
    slide.value       = (p.slide as Slide) ?? null;
    nextSlide.value   = (p.next_slide as Slide) ?? null;
    title.value       = (p.title as string) ?? "";
    progress.value    = (p.progress as number) ?? 0;
    slideIndex.value  = (p.slide_index as number) ?? 0;
    totalSlides.value = (p.total_slides as number) ?? (p.last_slide as number) ?? 0;

    if (import.meta.env.DEV && typeof p._ts === "number") {
      const log = (window as { __ljLatencyLog?: number[] }).__ljLatencyLog;
      if (Array.isArray(log)) log.push(Date.now() - (p._ts as number));
    }
  });

  // MEDIA_CLOSE ainda não é emitido por Media.js (planejado — BROADCAST_TYPE.MEDIA_CLOSE).
  // Quando implementado, limpar slide/nextSlide aqui automaticamente.

  const isCover = computed<boolean>(() =>
    !!(
      slide.value &&
      (slide.value.cover    === true  ||
       slide.value.tipo     === "CAPA" ||
       slide.value.is_cover === true  ||
       slideIndex.value     === 0)
    )
  );

  const bgImgStyle = computed<BgImgStyle>(() => {
    const pos = IMAGE_POSITION_MAP[slide.value?.image_position as string | number] || "center center";
    return {
      backgroundImage:    slide.value?.url_image
        ? `url(${slide.value.url_image as string})`
        : undefined,
      backgroundSize:     "cover",
      backgroundPosition: pos,
    };
  });

  return {
    slide, nextSlide, title, progress, slideIndex, totalSlides,
    isCover, bgImgStyle,
  };
}
