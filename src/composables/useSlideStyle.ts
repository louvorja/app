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
  color_repeat: "#EFB400",     // refrão/repetição (gold por default)
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
  text_bg_transparent: false,  // caixa de texto atrás da letra (translúcida quando false)
  affect_external_slides: true, // formatação personalizada vence formatação do slide externo
});

export type SlideOption = Record<string, unknown> | null;

interface SlideStyleAPI {
  cfg:                ComputedRef<SlideCfg>;
  coverStyle:         (slide?: SlideOption) => CSSProperties;
  lyricStyle:         (slide?: SlideOption) => CSSProperties;
  auxStyle:           (slide?: SlideOption) => CSSProperties;
  nextStyle:          (slide?: SlideOption) => CSSProperties;
  bgStyle:            (slide?: SlideOption) => CSSProperties;
  rootStyle:          ComputedRef<CSSProperties>;
  repeatColor:        () => string;
  textBoxStyle:       () => CSSProperties;
}

interface SlideCfg {
  font: string;
  font_size_cover: number;
  font_size_lyric: number;
  font_size_aux: number;
  font_size_next: number;
  color_cover: string;
  color_lyric: string;
  color_repeat: string;
  color_next: string;
  color_aux: string;
  background_color: string;
  background_image: string;
  background_position: string;
  progress_color: string;
  show_progress_bar: boolean;
  show_title_first_slide: boolean;
  text_align: "top" | "center" | "bottom";
  transition_speed_ms: number;
  text_bg_transparent: boolean;
  affect_external_slides: boolean;
}

/**
 * Lê config do slide combinando:
 *   1. `userdata.options.slides.*` (legado/granular) — base
 *   2. Chaves planas `userdata.options.*` gravadas pela tela "Opções" do AppMenu,
 *      gated por `custom_text_format` e `custom_background` (toggles do Delphi).
 */
const _readSlideOpts = (): SlideCfg => {
  const legacy = ($userdata.get("options.slides", {}) as Partial<typeof SLIDE_DEFAULTS>) ?? {};
  const merged: SlideCfg = { ...SLIDE_DEFAULTS, ...legacy };

  // text_align e show_title_first_slide são chaves planas globais (sempre aplicam)
  const textAlign = $userdata.get<string>("options.text_align", null);
  if (textAlign === "top" || textAlign === "center" || textAlign === "bottom") {
    merged.text_align = textAlign;
  }
  const showTitle = $userdata.get<boolean>("options.show_title_first_slide", null);
  if (typeof showTitle === "boolean") merged.show_title_first_slide = showTitle;

  // Formatação de texto personalizada
  if ($userdata.get<boolean>("options.custom_text_format", false) === true) {
    const titleColor = $userdata.get<string>("options.title_color", null);
    const textColor = $userdata.get<string>("options.text_color", null);
    const repeatColor = $userdata.get<string>("options.repeat_color", null);
    const auxColor = $userdata.get<string>("options.aux_color", null);
    const titleSize = Number($userdata.get<number>("options.title_size", null) ?? NaN);
    const bodySize = Number($userdata.get<number>("options.body_size", null) ?? NaN);
    const auxSize = Number($userdata.get<number>("options.aux_size", null) ?? NaN);
    const textBgTransparent = $userdata.get<boolean>("options.text_bg_transparent", null);
    if (typeof titleColor === "string") merged.color_cover = titleColor;
    if (typeof textColor === "string") merged.color_lyric = textColor;
    if (typeof repeatColor === "string") merged.color_repeat = repeatColor;
    if (typeof auxColor === "string") merged.color_aux = auxColor;
    if (Number.isFinite(titleSize) && titleSize > 0) merged.font_size_cover = titleSize;
    if (Number.isFinite(bodySize) && bodySize > 0) merged.font_size_lyric = bodySize;
    if (Number.isFinite(auxSize) && auxSize > 0) merged.font_size_aux = auxSize;
    if (typeof textBgTransparent === "boolean") merged.text_bg_transparent = textBgTransparent;
  }

  // Flag global de "afetar slides externos"
  const affectExternal = $userdata.get<boolean>("options.affect_external_slides", null);
  if (typeof affectExternal === "boolean") merged.affect_external_slides = affectExternal;

  // Fundo personalizado
  if ($userdata.get<boolean>("options.custom_background", false) === true) {
    const bgTransparent = $userdata.get<boolean>("options.bg_transparent", false) === true;
    const bgColor = $userdata.get<string>("options.bg_color", null);
    const bgImage = $userdata.get<string>("options.bg_image", null);
    const bgPos = $userdata.get<string>("options.bg_position", null);
    merged.background_color = bgTransparent
      ? "transparent"
      : typeof bgColor === "string"
        ? bgColor
        : merged.background_color;
    if (typeof bgImage === "string") merged.background_image = bgImage;
    if (typeof bgPos === "string") {
      const map: Record<string, string> = {
        center: "center center",
        cover: "center center",
        contain: "center center",
        stretch: "center center",
        tile: "0 0",
      };
      merged.background_position = map[bgPos] || bgPos;
    }
  } else {
    // Sem fundo personalizado: usa Imagem de Fundo global (única chave global_bg_color)
    const globalBg = $userdata.get<string>("options.global_bg_color", null);
    if (typeof globalBg === "string") merged.background_color = globalBg;
  }

  return merged;
};

export function useSlideStyle(): SlideStyleAPI {
  const cfg = computed(() => _readSlideOpts());

  function _baseFont(slide: SlideOption): string {
    const fromSlide = slide && typeof slide.font === "string" ? slide.font : null;
    return (fromSlide as string) || cfg.value.font;
  }

  /** Quando affect_external_slides=true, ignora overrides do slide e usa só o cfg. */
  function _pickSize(fromSlide: number | undefined, fromCfg: number): number {
    if (cfg.value.affect_external_slides) return fromCfg;
    return Number(fromSlide) || fromCfg;
  }
  function _pickColor(fromSlide: string | undefined, fromCfg: string): string {
    if (cfg.value.affect_external_slides) return fromCfg;
    return fromSlide || fromCfg;
  }

  function coverStyle(slide?: SlideOption): CSSProperties {
    const sizePct = _pickSize(
      (slide as { font_size_pct?: number })?.font_size_pct,
      cfg.value.font_size_cover
    );
    const color = _pickColor(
      (slide as { color?: string })?.color,
      cfg.value.color_cover
    );
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
    const sizePct = _pickSize(
      (slide as { font_size_pct?: number })?.font_size_pct,
      cfg.value.font_size_lyric
    );
    const color = _pickColor(
      (slide as { color?: string })?.color,
      cfg.value.color_lyric
    );
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
    const sizePct = _pickSize(
      (slide as { font_size_aux_pct?: number })?.font_size_aux_pct,
      cfg.value.font_size_aux
    );
    const color = _pickColor(
      (slide as { color_aux?: string })?.color_aux,
      cfg.value.color_aux
    );
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
    const url = cfg.value.affect_external_slides
      ? cfg.value.background_image || ""
      : slideUrl || cfg.value.background_image || "";
    return {
      backgroundImage: url ? `url(${url})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: cfg.value.background_position,
      backgroundColor: cfg.value.background_color,
    };
  }

  /** Cor para texto repetido (refrão). */
  function repeatColor(): string {
    return cfg.value.color_repeat;
  }

  /** Caixa de texto translúcida atrás da letra (CSS para inline-block). */
  function textBoxStyle(): CSSProperties {
    if (cfg.value.text_bg_transparent) {
      return { backgroundColor: "transparent" };
    }
    return { backgroundColor: "rgba(0, 0, 0, 0.75)" };
  }

  const rootStyle = computed<CSSProperties>(() => ({
    background: cfg.value.background_color,
    transition: `opacity ${cfg.value.transition_speed_ms}ms linear`,
  }));

  return { cfg, coverStyle, lyricStyle, auxStyle, nextStyle, bgStyle, rootStyle, repeatColor, textBoxStyle };
}
