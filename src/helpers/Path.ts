/** @category helper-puro — Constrói URLs do banco e arquivos. Seguro no Electron main process; sem APIs Vue. */
import Platform from "@/helpers/Platform";

const DB_KEY_RE = /^[a-zA-Z0-9_-]+$/;

export default {
  /**
   * Constrói a URL para um arquivo do banco de dados JSON.
   *
   * No desktop (Electron): retorna louvorja://json_db/<path> — servido via
   *   protocolo customizado com cache local em userData/json_db/.
   * No web/PWA: retorna VITE_URL_DATABASE + <path> diretamente.
   *
   * @param path  Ex: "/pt_musics" ou "/music_123"
   */
  db(path: string): string {
    const key = path.startsWith("/") ? path.slice(1) : path;
    if (!DB_KEY_RE.test(key)) {
      throw new Error(`Path.db: chave inválida "${key}"`);
    }
    if (Platform.isDesktop) {
      return "louvorja://json_db/" + key;
    }
    const base = import.meta.env.VITE_URL_DATABASE;
    if (!base) {
      // Sem fallback: retornar `"undefined/..."` faz a request 404 com erro
      // críptico. Lançar aqui torna o problema visível no boot — o operador
      // sabe que precisa configurar o `.env` ou rodar via Electron.
      throw new Error(
        "Path.db: VITE_URL_DATABASE não definida. Configure no .env ou abra o app via Electron."
      );
    }
    return base + "/" + key;
  },

  /**
   * Constrói a URL para um arquivo de mídia (áudio, imagem, etc.).
   *
   * No desktop (Electron): retorna louvorja://files/<path> — servido via
   *   protocolo customizado a partir de userData/files/ (populado em D3).
   * No web/PWA: retorna VITE_URL_FILES + <path> diretamente.
   *
   * @param path  Ex: "/audio/12345.mp3"
   */
  file(path: string): string {
    if (path.includes("..") || /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//i.test(path)) {
      throw new Error(`Path.file: caminho inválido "${path}"`);
    }
    if (Platform.isDesktop) {
      const p = path.startsWith("/") ? path : "/" + path;
      return "louvorja://files" + p;
    }
    const base = import.meta.env.VITE_URL_FILES;
    if (!base) {
      throw new Error(
        "Path.file: VITE_URL_FILES não definida. Configure no .env ou abra o app via Electron."
      );
    }
    return base + path;
  },
};
