/**
 * Configurações visuais centralizadas dos slides de música.
 *
 * As views Projection / ProjectionReturn / Operator e o overlay do Player
 * (media/Index.vue) lêem styles deste composable em vez de hardcode.
 *
 * Persistência: `userdata.options.slides.*` (configurável via Formatação).
 *
 * Cada `slide.*` individual ainda pode sobrescrever via campos próprios
 * (ex.: `slide.color`, `slide.font_size_pct`) — fiel ao Delphi onde o
 * editor de slides definia formatação por slide.
 */

import { computed, type ComputedRef, type CSSProperties } from "vue";
import $userdata from "@/helpers/UserData";

/**
 * Defaults que replicam o visual original do Delphi/Projection atual.
 * Aplicados quando o usuário ainda não configurou em "Formatação".
 */
export const SLIDE_DEFAULTS = Object.freeze({
  font: "Arial, sans-serif",
  font_size_cover: 18,         // % da viewport height (vh)
  font_size_lyric: 14,
  font_size_aux: 8,
  font_size_next: 5,           // ProjectionReturn — próximo slide
  color_cover: "#EFB400",      // gold (cor da capa Delphi)
  color_lyric: "#FFFFFF",
  color_next: "#FFFFFF",
  color_aux: "#EFB400",
  background_color: "#000000",
  background_image: "",
  background_position: "center center",
  progress_color: "#EFB400",
  show_progress_bar: true,
  show_title_first_slide: true,
  text_align: "center" as "top" | "center" | "bottom",
  transition_speed_ms: 256,    // fade-in da tela inteira (AlphaBlend Delphi)
});

export type SlideOption = Record<string, unknown> | null;

interface SlideStyleAPI {
  cfg:                ComputedRef<typeof SLIDE_DEFAULTS>;
  coverStyle:         (slide?: SlideOption) => CSSProperties;
  lyricStyle:         (slide?: SlideOption) => CSSProperties;
  auxStyle:           (slide?: SlideOption) => CSSProperties;
  nextStyle:          (slide?: SlideOption) => CSSProperties;
  bgStyle:            (slide?: SlideOption) => CSSProperties;
  rootStyle:          ComputedRef<CSSProperties>;
}

const _readSlideOpts = (): typeof SLIDE_DEFAULTS => {
  const stored = ($userdata.get("options.slides", {}) as Partial<typeof SLIDE_DEFAULTS>) ?? {};
  return { ...SLIDE_DEFAULTS, ...stored };
};

export function useSlideStyle(): SlideStyleAPI {
  const cfg = computed(() => _readSlideOpts());

  function _baseFont(slide: SlideOption): string {
    const fromSlide = slide && typeof slide.font === "string" ? slide.font : null;
    return (fromSlide as string) || cfg.value.font;
  }

  function coverStyle(slide?: SlideOption): CSSProperties {
    const sizePct =
      Number((slide as { font_size_pct?: number })?.font_size_pct) || cfg.value.font_size_cover;
    const color = (slide as { color?: string })?.color || cfg.value.color_cover;
    return {
      fontFamily: _baseFont(slide ?? null),
      fontSize: `clamp(28px, ${sizePct}vh, 200px)`,
      color,
      fontWeight: 700,
      textAlign: "center",
      letterSpacing: "0.02em",
      textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
      lineHeight: 1.3,
      maxWidth: "92vw",
    };
  }

  function lyricStyle(slide?: SlideOption): CSSProperties {
    const sizePct =
      Number((slide as { font_size_pct?: number })?.font_size_pct) || cfg.value.font_size_lyric;
    const color = (slide as { color?: string })?.color || cfg.value.color_lyric;
    return {
      fontFamily: _baseFont(slide ?? null),
      fontSize: `clamp(28px, ${sizePct}vh, 200px)`,
      color,
      fontWeight: 600,
      textAlign: "center",
      letterSpacing: "0.01em",
      textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.6)",
      lineHeight: 1.3,
      maxWidth: "92vw",
    };
  }

  function auxStyle(slide?: SlideOption): CSSProperties {
    const sizePct =
      Number((slide as { font_size_aux_pct?: number })?.font_size_aux_pct) || cfg.value.font_size_aux;
    const color = (slide as { color_aux?: string })?.color_aux || cfg.value.color_aux;
    return {
      fontFamily: _baseFont(slide ?? null),
      fontSize: `clamp(20px, ${sizePct}vh, 120px)`,
      color,
      fontWeight: 600,
      textAlign: "center",
      textShadow: "0 2px 12px rgba(0,0,0,0.9)",
      lineHeight: 1.3,
      maxWidth: "92vw",
    };
  }

  function nextStyle(slide?: SlideOption): CSSProperties {
    const sizePct = cfg.value.font_size_next;
    return {
      fontFamily: _baseFont(slide ?? null),
      fontSize: `clamp(14px, ${sizePct}vh, 60px)`,
      color: cfg.value.color_next,
      opacity: 0.85,
      fontWeight: 600,
      lineHeight: 1.2,
      textShadow: "0 1px 4px rgba(0,0,0,0.6)",
    };
  }

  function bgStyle(slide?: SlideOption): CSSProperties {
    const slideUrl = (slide as { url_image?: string })?.url_image;
    const url = slideUrl || cfg.value.background_image || "";
    return {
      backgroundImage: url ? `url(${url})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: cfg.value.background_position,
      backgroundColor: cfg.value.background_color,
    };
  }

  const rootStyle = computed<CSSProperties>(() => ({
    background: cfg.value.background_color,
    transition: `opacity ${cfg.value.transition_speed_ms}ms linear`,
  }));

  return { cfg, coverStyle, lyricStyle, auxStyle, nextStyle, bgStyle, rootStyle };
}
