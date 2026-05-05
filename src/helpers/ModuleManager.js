/** @category deve-virar-composable — Usa AppData + UserData (Pinia). Boot-time; chamado 1× em main.js. */
import $appdata from "./AppData";
import $userdata from "./UserData";
import $dev from "./Dev";
import $alert from "./Alert";

/**
 * ModuleManager — lifecycle de módulos (boot-time).
 *
 * Responsabilidade: descobrir, validar, instalar e registrar módulos no store.
 * Chamado UMA VEZ durante o boot (main.js → ModuleManager.init(i18n)).
 *
 * NÃO lida com abertura/fechamento de módulos em runtime — isso é Modules.js.
 *
 * Fluxo de boot:
 *   init(i18n)
 *     └─ glob de src/modules/index.js
 *          └─ installModule(module)
 *               ├─ $appdata.set("modules.<id>", {...})   ← estado runtime
 *               ├─ $appdata.set("module_group", {...})   ← agrupamento de menu
 *               ├─ i18n.mergeLocaleMessage(...)          ← traduções
 *               └─ $userdata.setIfNull(...)              ← defaults de customização
 */
export default {
  /** Referência ao i18n, injetada por init(). */
  i18n: null,

  /**
   * Instala um único módulo: registra no store, carrega i18n e customization.
   * Idempotente por design — a chave no $appdata é sobrescrita a cada boot.
   */
  async installModule(module) {
    try {
      const manifest = module.manifest;

      if (!manifest.active) {
        if ($appdata.get("is_dev")) {
          console.warn(`Module ${manifest.id} disabled`);
        }
        return;
      }

      // Registra o módulo no $appdata para que Modules.js possa operar sobre ele.
      $appdata.set(`modules.${manifest.id}`, {
        id: manifest.id,
        title: manifest.translationKey || `modules.${manifest.id}.title`,
        icon: manifest.icon || "mdi-puzzle",
        show: false,
        language: manifest.language,
        type: "module",
        showInMainMenu: manifest.showInMainMenu || false,
        development: manifest.development || false,
        ...(manifest.moduleOptions || {}),
        manifest,
      });

      // Adiciona ao grupo de categoria para o menu lateral.
      const category = manifest.category;
      if (category) {
        const moduleGroups = $appdata.get("module_group") || {};
        if (!moduleGroups[category]) {
          // Categoria desconhecida — cria entrada dinamicamente para não travar o boot.
          moduleGroups[category] = { title: `module_group.${category}.title`, modules: [] };
        }
        if (!moduleGroups[category].modules.includes(manifest.id)) {
          moduleGroups[category].modules.push(manifest.id);
        }
        $appdata.set("module_group", moduleGroups);
      }

      // Carrega traduções declaradas no manifesto.
      if (manifest.translations) {
        Object.entries(manifest.translations).forEach(([lang, translations]) => {
          this.i18n.global.mergeLocaleMessage(lang, {
            modules: { [manifest.id]: translations },
          });
        });
      }

      // Inicializa valores padrão de customização (não sobrescreve preferências salvas).
      if (manifest.customization) {
        Object.entries(manifest.customization).forEach(([key, customization]) => {
          $userdata.setIfNull(`modules.${manifest.id}.${key}`, customization.default ?? null);
        });
      }

      $dev.write("module_install", manifest.id, manifest.development ? "[dev]" : "");
      return true;
    } catch (error) {
      console.error(`Failed to install module ${module.manifest.id}:`, error);
      return false;
    }
  },

  /**
   * Ponto de entrada do boot. Descobre todos os módulos via glob,
   * valida a consistência pasta/id e instala cada um.
   *
   * Chamado em main.js após createApp(), antes do mount().
   */
  async init(i18n) {
    this.i18n = i18n;

    // eager: false → cada index.js é avaliado sob demanda (menor custo síncrono no boot).
    const modules = import.meta.glob("@/modules/**/index.js");

    for (const path in modules) {
      try {
        const moduleFactory = modules[path];
        const moduleExports = await moduleFactory();
        const ModuleClass = moduleExports.default;
        if (typeof ModuleClass === "function") {
          const module = new ModuleClass();
          const parts = path.split("/");
          if (module?.manifest?.id !== parts[parts.length - 2]) {
            $alert.error({
              text: "messages.misconfigured_module",
              error: path,
            });
          } else {
            await this.installModule(module);
          }
        }
      } catch (e) {
        console.warn(`[ModuleManager] Falha ao carregar módulo ${path}:`, e);
      }
    }

    // Sinaliza ao renderer que os componentes de módulo podem ser importados.
    $appdata.set("import_modules", true);
  },
};
