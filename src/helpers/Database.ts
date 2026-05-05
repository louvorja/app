/** @category helper-puro — Carrega JSONs do banco com cache sessionStorage. Sem APIs Vue. */
import $alert from "@/helpers/Alert";
import $path from "@/helpers/Path";
import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";

const CACHE_TTL_MS = 3600 * 1000;

interface CacheEntry<T> {
  data: T;
  ts: number;
  v: string;
}

function getVersion(): string {
  return import.meta.env.VITE_DB_VERSION || "";
}

export default {
  async get<T = unknown>(file: string): Promise<T | null> {
    try {
      const cache_name = `db:${file}`;
      const cached = $storage.get<CacheEntry<T>>(cache_name, null, "session");

      if (cached && typeof cached === "object" && "ts" in cached) {
        const { data, ts, v } = cached;
        if (Date.now() - ts <= CACHE_TTL_MS && v === getVersion()) {
          $dev.write(`Lendo BD do cache`, file);
          return data;
        }
      }

      const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      $dev.write("Abrindo BD", `${$path.db(`/${file}`)}?${date}`);
      const response = await fetch(`${$path.db(`/${file}`)}?${date}`, {
        headers: {
          "Api-Token": import.meta.env.VITE_API_TOKEN as string,
        },
      });

      if (!response.ok) throw new Error();
      const data = (await response.json()) as T;

      $dev.write("Salvando BD em cache", file);
      try {
        $storage.set(cache_name, { data, ts: Date.now(), v: getVersion() }, "session");
      } catch {
        // sessionStorage quota exceeded — cache miss is acceptable
      }

      return data;
    } catch (error) {
      $alert.error({ text: "messages.file_database_not_found", error });
      return null;
    }
  },
};
