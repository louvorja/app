import { ref, type Ref } from "vue";
import $appdata from "@/helpers/AppData";
import $database from "@/helpers/Database";
import $dev from "@/helpers/Dev";

export interface AlbumItem {
  id_album: number | string;
  name?: string;
  track?: number;
  url_image?: string;
  order?: number;
  categories?: string[];
  [key: string]: unknown;
}

export interface AlbumData {
  categories?: string[];
  albums?: AlbumItem[];
  [key: string]: unknown;
}

interface OpenResult {
  redirect: string | null;
}

interface AlbumInstance {
  data: Ref<AlbumData>;
  loading: Ref<boolean>;
  id_album: Ref<string | number | null>;
  open: (albumId: string | number) => Promise<OpenResult>;
  close: () => void;
  setAlbumInfo: (albumId: string | number | null, module?: string) => void;
}

let _shared: AlbumInstance | null = null;

function _create(): AlbumInstance {
  const data     = ref<AlbumData>({});
  const loading  = ref(false);
  const id_album = ref<string | number | null>(null);

  async function open(albumId: string | number): Promise<OpenResult> {
    $dev.write("open album", albumId);

    loading.value = true;
    $appdata.set("modules.album.loading", true);

    const albumData = await $database.get<AlbumData>(`album_${albumId}`);
    if (albumData == null) {
      close();
      return { redirect: null };
    }

    data.value = albumData;
    $appdata.set("modules.album.data", albumData);

    const hymnalCategory = albumData.categories?.find((c) => c.startsWith("hymnal."));
    if (hymnalCategory) {
      loading.value = false;
      $appdata.set("modules.album.loading", false);
      return { redirect: hymnalCategory.split(".")[1] };
    }

    id_album.value = albumId;
    $appdata.set("modules.album.id_album", albumId);
    $appdata.set("modules.album.show", true);
    $appdata.set("modules.album.loading", false);
    loading.value = false;

    return { redirect: null };
  }

  function close(): void {
    $dev.write("close album");
    data.value     = {};
    id_album.value = null;
    loading.value  = false;
    $appdata.set("modules.album.show", false);
    $appdata.set("modules.album.data", {});
    $appdata.set("modules.album.id_album", null);
    $appdata.set("modules.album.loading", false);
  }

  function setAlbumInfo(albumId: string | number | null, module = "media"): void {
    const moduleData = $appdata.get<AlbumData>(`modules.${module}.data`);
    if (!moduleData?.albums?.length) {
      $appdata.set(`modules.${module}.config.subtitle`, "");
      $appdata.set(`modules.${module}.config.track`, 0);
      $appdata.set(`modules.${module}.config.image`, "");
      return;
    }

    let album: AlbumItem | null = null;
    if (albumId) {
      album = moduleData.albums.find((item) => item.id_album == albumId) ?? null;
    } else if (moduleData.albums.length === 1) {
      album = moduleData.albums[0];
    } else {
      album = [...moduleData.albums].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
    }

    if (!album) {
      $appdata.set(`modules.${module}.config.subtitle`, "");
      $appdata.set(`modules.${module}.config.track`, 0);
      $appdata.set(`modules.${module}.config.image`, "");
      return;
    }

    $appdata.set(`modules.${module}.config.subtitle`, album.name);
    $appdata.set(`modules.${module}.config.track`, album.track);
    $appdata.set(`modules.${module}.config.image`, album.url_image);
  }

  return { data, loading, id_album, open, close, setAlbumInfo };
}

export function useAlbum(): AlbumInstance {
  if (!_shared) _shared = _create();
  return _shared;
}
