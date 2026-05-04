import $alert from "@/helpers/Alert";
import $path from "@/helpers/Path";
import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";

const CACHE_TTL_MS = 3600 * 1000;

function getVersion() {
  return import.meta.env.VITE_DB_VERSION || "";
}

export default {
  async get(file) {
    try {
      const cache_name = `db:${file}`;
      const cached = $storage.get(cache_name, null, "session");

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
          "Api-Token": import.meta.env.VITE_API_TOKEN,
        },
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

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
