// @/helpers/ModuleManager.js
import $appdata from "./AppData";
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
        // Create category if not exists
        /*if (!moduleGroups[category]) {
        moduleGroups[category] = {
          title: `module_group.${category}.title`,
          modules: [],
        };
      }*/

        // Add module to category if not already present
        if (!moduleGroups[category].modules.includes(manifest.id)) {
          moduleGroups[category].modules.push(manifest.id);
        }

        // Save updated module groups
        $appdata.set("module_group", moduleGroups);
      }

      // Add to main menu
      const showInMainMenu = manifest.showInMainMenu;
      if (showInMainMenu) {
        const moduleMainMenu = $appdata.get("menu") || {};
        // Add module to main menu if not already present
        if (!moduleMainMenu.modules.includes(manifest.id)) {
          moduleMainMenu.modules.push(manifest.id);
        }
        // Save updated module groups
        $appdata.set("menu", moduleMainMenu);
      }

      // Auto-load translations
      if (manifest.translations) {
        Object.entries(manifest.translations).forEach(
          ([lang, translations]) => {
            this.i18n.global.mergeLocaleMessage(lang, {
              modules: { [manifest.id]: translations },
            });
          }
        );
      }

      // Log installation
      $dev.write(
        "module_install",
        manifest.id,
        manifest.development ? "[dev]" : ""
      );

      return true;
    } catch (error) {
      console.error(`Failed to install module ${module.manifest.id}:`, error);
      return false;
    }
  },

  // Remote module installation method
  async installRemoteModule(moduleId) {
    try {
      // Fetch module manifest from remote module store
      const manifest = await this.fetchModuleManifest(moduleId);

      // Download module module dynamically
      const ModuleClass = await this.downloadModuleModule(manifest);

      // Create module instance
      const moduleInstance = new ModuleClass();

      // Register and install module
      if (this.register(moduleId, moduleInstance)) {
        await this.installModule(moduleInstance);
        return moduleInstance;
      }

      return null;
    } catch (error) {
      console.error("Remote module installation failed:", error);
      throw error;
    }
  },

  async init(i18n) {
    this.i18n = i18n;

    const modules = import.meta.glob("@/modules/**/index.js", {
      eager: true,
    });

    for (const path in modules) {
      console.log(`[ModuleManager] Found module at: ${path}`);
      const ModuleClass = modules[path].default;
      if (typeof ModuleClass === "function") {
        const module = new ModuleClass();
        const parts = path.split("/");
        if (module?.manifest?.id != parts[parts.length - 2]) {
          console.error(`[ModuleManager] ID mismatch for ${path}: ${module?.manifest?.id} vs ${parts[parts.length - 2]}`);
          $alert.error({
            text: "messages.misconfigured_module",
            error: path,
          });
        } else {
          console.log(`[ModuleManager] Installing module: ${module.manifest.id}`);
          await this.installModule(module);
        }
      }
    }

    //Importa as interfaces dos modules
    $appdata.set("import_modules", true);

    // Optional: Remote module installation
    try {
      // Uncomment and modify as needed
      // await ModuleManager.installRemoteModule('some-module-id');
    } catch (error) {
      console.error("Failed to install remote module", error);
    }
  },
};
