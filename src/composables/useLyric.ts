import { ref, computed, type Ref, type ComputedRef } from "vue";
import $database from "@/helpers/Database";
import $dev from "@/helpers/Dev";

export interface LyricLine {
  id?: number;
  order: number;
  lyric?: string;
  time?: string;
  instrumental_time?: string;
  url_image?: string;
  image_position?: string | number;
  show_slide?: number;
  [key: string]: unknown;
}

interface AlbumItem {
  id_album: number | string;
  name?: string;
  track?: number;
  url_image?: string;
  order?: number;
}

export interface MusicData {
  name?: string;
  lyric?: Record<string, LyricLine>;
  albums?: AlbumItem[];
  url_image?: string;
  image_position?: string | number;
  url_music?: string;
  url_instrumental_music?: string;
  has_instrumental_music?: boolean;
  [key: string]: unknown;
}

interface LyricConfig {
  title: string;
  subtitle: string;
  track: number;
  image: string;
}

export interface LyricOpenParams {
  id_music: string | number;
  id_album?: string | number | null;
}

interface LyricInstance {
  data: Ref<MusicData | null>;
  loading: Ref<boolean>;
  id_music: Ref<string | number | null>;
  id_album: Ref<string | number | null>;
  config: ComputedRef<LyricConfig>;
  lyric: ComputedRef<LyricLine[]>;
  open: (params: LyricOpenParams) => Promise<boolean>;
  close: () => void;
}

let _shared: LyricInstance | null = null;

function _create(): LyricInstance {
  const data     = ref<MusicData | null>(null);
  const loading  = ref(false);
  const id_music = ref<string | number | null>(null);
  const id_album = ref<string | number | null>(null);

  const config = computed<LyricConfig>(() => {
    const d = data.value;
    if (!d) return { title: "", subtitle: "", track: 0, image: "" };

    const albums = d.albums ?? [];
    let album: AlbumItem | null = null;
    if (id_album.value) {
      album = albums.find((a) => a.id_album == id_album.value) ?? null;
    } else if (albums.length === 1) {
      album = albums[0];
    } else if (albums.length > 1) {
      album = [...albums].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
    }

    return {
      title:    d.name ?? "",
      subtitle: album?.name ?? "",
      track:    album?.track ?? 0,
      image:    album?.url_image ?? "",
    };
  });

  const lyric = computed<LyricLine[]>(() => {
    if (!data.value?.lyric) return [];
    return Object.values(data.value.lyric).slice().sort((a, b) => a.order - b.order);
  });

  async function open(params: LyricOpenParams): Promise<boolean> {
    $dev.write("open lyric", params);

    loading.value  = true;
    id_music.value = params.id_music ?? null;
    id_album.value = params.id_album ?? null;

    const result = await $database.get<MusicData>(`music_${params.id_music}`);
    if (!result) {
      loading.value = false;
      return false;
    }

    data.value    = result;
    loading.value = false;
    return true;
  }

  function close(): void {
    $dev.write("close lyric");
    data.value     = null;
    loading.value  = false;
    id_music.value = null;
    id_album.value = null;
  }

  return { data, loading, id_music, id_album, config, lyric, open, close };
}

export function useLyric(): LyricInstance {
  if (!_shared) _shared = _create();
  return _shared;
}
