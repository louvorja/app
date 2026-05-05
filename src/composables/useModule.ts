import { computed, getCurrentInstance, type ComputedRef } from "vue";
import AppData from "@/helpers/AppData";
import UserData from "@/helpers/UserData";
import Modules from "@/helpers/Modules";
import Media from "@/composables/useMedia";
import Database from "@/helpers/Database";
import Alert from "@/helpers/Alert";
import Path from "@/helpers/Path";
import DateTime from "@/helpers/DateTime";
import Strings from "@/helpers/Strings";
import Favorites from "@/helpers/Favorites";
import History from "@/helpers/History";
import Broadcast from "@/helpers/Broadcast";
import Liturgy from "@/helpers/Liturgy";
import Platform from "@/helpers/Platform";
import Popup from "@/helpers/Popup";

export interface ModuleManifest {
  id: string;
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  dependencies?: string[];
  [key: string]: unknown;
}

/**
 * useModule — composable que padroniza o acesso ao estado/userdata de um módulo.
 *
 * Substitui o boilerplate replicado em ~20 módulos (computed module_id, module,
 * userdata Proxy, método t()).
 *
 * Uso (em <script setup>):
 *
 *   import { useModule } from "@/composables/useModule";
 *   import manifest from "../manifest.json";
 *
 *   const { moduleId, module, userdata, appdata, t, $t, $i18n, $vuetify, proxy }
 *     = useModule(manifest);
 */
export function useModule(manifest: ModuleManifest) {
  const moduleId = manifest?.id;
  const inst = getCurrentInstance();
  const proxy = inst?.proxy ?? null;

  const module: ComputedRef<Record<string, unknown>> = computed(
    () => (AppData.get(`modules.${moduleId}`) as Record<string, unknown>) || {}
  );

  const userdata = new Proxy({} as Record<string, unknown>, {
    get(_: Record<string, unknown>, key: string | symbol): unknown {
      return UserData.get(`modules.${moduleId}.${String(key)}`, null);
    },
    set(_: Record<string, unknown>, key: string | symbol, value: unknown): boolean {
      UserData.set(`modules.${moduleId}.${String(key)}`, value);
      return true;
    },
  });

  const appdata = new Proxy({} as Record<string, unknown>, {
    get(_: Record<string, unknown>, key: string | symbol): unknown {
      return AppData.get(`modules.${moduleId}.${String(key)}`, null);
    },
    set(_: Record<string, unknown>, key: string | symbol, value: unknown): boolean {
      AppData.set(`modules.${moduleId}.${String(key)}`, value);
      return true;
    },
  });

  type ProxyWithHelpers = Record<string, unknown> & {
    $t?: (k: string) => string;
    $i18n?: unknown;
    $vuetify?: unknown;
  };
  const _p = proxy as unknown as ProxyWithHelpers | null;

  const t = (key: string): string =>
    _p?.$t?.(`modules.${moduleId}.${key}`) ?? key;

  return {
    manifest,
    moduleId,
    module,
    userdata,
    appdata,
    t,
    $t:        _p?.$t,
    $i18n:     _p?.$i18n,
    $vuetify:  _p?.$vuetify,
    $modules:  Modules,
    $media:    Media,
    $database: Database,
    $userdata: UserData,
    $appdata:  AppData,
    $alert:    Alert,
    $path:     Path,
    $datetime: DateTime,
    $string:   Strings,
    $favorites: Favorites,
    $history:  History,
    $broadcast: Broadcast,
    $liturgy:  Liturgy,
    $platform: Platform,
    $popup:    Popup,
    proxy,
  };
}
