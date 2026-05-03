// @/helpers/ModuleManager.js
import $appdata from "./AppData";
import $userdata from "./UserData";
import $dev from "./Dev";
import $alert from "./Alert";

export default {
  modules: new Map(),
  manifests: new Map(),

  register(moduleName, module) {
    if (!this.modules.has(moduleName)) {
      this.modules.set(moduleName, module);
      return true;
    }
    return false;
  },

  async installModule(module) {
    try {
      // Auto-configure module
      const manifest = module.manifest;

      if (!manifest.active) {
        if ($appdata.get("is_dev")) {
          //Mostra o alerta somente no modo de desenvolvimento!
          console.warn(`Module ${module.manifest.id} disabled`);
        }
        return;
      }

      // Register module in application's modules
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

      // Add to module groups
      const category = manifest.category;
      if (category) {
        const moduleGroups = $appdata.get("module_group") || {};
        if (!moduleGroups[category].modules.includes(manifest.id)) {
          moduleGroups[category].modules.push(manifest.id);
        }

        // Save updated module groups
        $appdata.set("module_group", moduleGroups);
      }

      // Auto-load translations
      if (manifest.translations) {
        Object.entries(manifest.translations).forEach(([lang, translations]) => {
          this.i18n.global.mergeLocaleMessage(lang, {
            modules: { [manifest.id]: translations },
          });
        });
      }

      // Install customization options
      if (manifest.customization) {
        Object.entries(manifest.customization).forEach(([key, customization]) => {
          $userdata.setIfNull(`modules.${manifest.id}.${key}`, customization.default ?? null);
        });
      }

      // Log installation
      $dev.write("module_install", manifest.id, manifest.development ? "[dev]" : "");

      return true;
    } catch (error) {
      console.error(`Failed to install module ${module.manifest.id}:`, error);
      return false;
    }
  },

  async init(i18n) {
    this.i18n = i18n;

    // eager: false → cada index.js é carregado sob demanda via Promise,
    // reduzindo o trabalho síncrono no boot (o chunk JS só é avaliado quando
    // a factory é chamada, não quando o glob é criado).
    const modules = import.meta.glob("@/modules/**/index.js");

    for (const path in modules) {
      try {
        const moduleFactory = modules[path];
        const moduleExports = await moduleFactory();
        const ModuleClass = moduleExports.default;
        if (typeof ModuleClass === "function") {
          const module = new ModuleClass();
          const parts = path.split("/");
          if (module?.manifest?.id != parts[parts.length - 2]) {
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

    //Importa as interfaces dos modules
    $appdata.set("import_modules", true);
  },
};
