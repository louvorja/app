import Platform from "@/helpers/Platform";

export default {
  /**
   * Constrói a URL para um arquivo do banco de dados JSON.
   *
   * No desktop (Electron): retorna louvorja://json_db/<path> — servido via
   *   protocolo customizado com cache local em userData/json_db/.
   * No web/PWA: retorna VITE_URL_DATABASE + <path> diretamente.
   *
   * @param {string} path  Ex: "/pt_musics" ou "/music_123"
   * @returns {string}
   */
  db(path) {
    if (Platform.isDesktop) {
      const p = path.startsWith("/") ? path : "/" + path;
      return "louvorja://json_db" + p;
    }
    const url = import.meta.env.VITE_URL_DATABASE;
    return url + path;
  },

  /**
   * Constrói a URL para um arquivo de mídia (áudio, imagem, etc.).
   *
   * No desktop (Electron): retorna louvorja://files/<path> — servido via
   *   protocolo customizado a partir de userData/files/ (populado em D3).
   * No web/PWA: retorna VITE_URL_FILES + <path> diretamente.
   *
   * @param {string} path  Ex: "/audio/12345.mp3"
   * @returns {string}
   */
  file(path) {
    if (Platform.isDesktop) {
      const p = path.startsWith("/") ? path : "/" + path;
      return "louvorja://files" + p;
    }
    const url = import.meta.env.VITE_URL_FILES;
    return url + path;
  },
};
