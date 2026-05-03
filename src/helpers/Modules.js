import $dev from "@/helpers/Dev";
import $appdata from "@/helpers/AppData";

/**
 * Modules — runtime de módulos (open / close / query).
 *
 * Responsabilidade: controlar visibilidade e estado de módulos já instalados.
 * Opera sobre `$appdata.modules.<id>`, populado pelo ModuleManager no boot.
 *
 * NÃO instala nem registra módulos — isso é ModuleManager.js.
 *
 * Comportamento (replica PageControl Delphi):
 * - Abrir um módulo embedded fecha automaticamente os outros embedded.
 * - Módulos popup (album, lyric, media) coexistem com embedded.
 * - O Modules.vue só monta os módulos com show=true ou minimized=true.
 */

export default {
  /** Verifica se o módulo está registrado (em $appdata.modules.<id>). */
  check(id) {
    return $appdata.exists(`modules.${id}`);
  },

  /** Abre um módulo. Fecha embedded abertos quando o que abre é embedded. */
  open(id) {
    if (!this.check(id)) {
      console.error(
        `[Modules] open(${id}) — módulo não registrado. Disponíveis:`,
        Object.keys($appdata.get("modules") || {})
      );
      return;
    }
    $dev.write("open", id);

    const opening = $appdata.get(`modules.${id}`);
    const openingIsPopup = opening?.popup === true;

    if (!openingIsPopup) {
      const all = $appdata.get("modules") || {};
      Object.keys(all).forEach((other) => {
        if (other === id) return;
        const m = all[other];
        if (m?.show && m?.popup !== true) {
          $appdata.set(`modules.${other}.show`, false);
        }
      });
    }

    $appdata.set(`modules.${id}.show`, true);
  },

  /** Fecha um módulo (não importa se popup ou embedded). */
  close(id) {
    if (!this.check(id)) return;
    $dev.write("close", id);
    $appdata.set(`modules.${id}.show`, false);
  },

  /**
   * No shell embedded, minimizar = fechar.
   * (Tray-area do layout antigo foi removida.)
   */
  minimize(id) {
    this.close(id);
  },

  /**
   * Retorna o objeto de um módulo específico (ou TODOS quando id é null).
   * Quando recebe um array, retorna apenas os módulos correspondentes.
   */
  get(id = null) {
    if (id == null) return $appdata.get("modules");
    if (typeof id === "string") return $appdata.get(`modules.${id}`);

    if (!Array.isArray(id) || id.length === 0) return {};

    return Object.fromEntries(
      id.map((moduleId) => [moduleId, { id: moduleId, ...$appdata.get(`modules.${moduleId}`) }])
    );
  },

  /**
   * Lista visível: módulos com show=true ou minimized=true (popups minimizados).
   * Útil para o renderer só montar quem está realmente em uso.
   */
  visible() {
    const all = $appdata.get("modules") || {};
    return Object.values(all).filter((m) => m && (m.show === true || m.minimized === true));
  },

  /**
   * Ordena lista de módulos pelo título traduzido. Usado pelo CommandPalette.
   */
  sort(modules, $t) {
    return Object.entries(modules)
      .sort(([, a], [, b]) => {
        const ta = a?.title ? $t(a.title).toLowerCase() : "";
        const tb = b?.title ? $t(b.title).toLowerCase() : "";
        return ta.localeCompare(tb);
      })
      .reduce((acc, [k, v]) => {
        acc[k] = v;
        return acc;
      }, {});
  },
};
