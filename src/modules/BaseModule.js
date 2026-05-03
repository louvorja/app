export default class BaseModule {
  constructor(manifest) {
    this.manifest = {
      active: manifest.active ?? true,
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      category: manifest.category,
      icon: manifest.icon,
      showInMainMenu: manifest.showInMainMenu || false,
      development: manifest.development || false,
      language: manifest.language || null,
      dependencies: manifest.dependencies || [],
      translations: manifest.translations || {},
      system: manifest.system ?? false,
      customization: manifest.customization || {},
      // moduleOptions guarda flags como popup, size, e outras opções que o
      // ModuleManager espalha em modules.${id}. Sem isso, popups (album, lyric,
      // media) NUNCA marcam popup=true e o Modules.open() fecha-os erroneamente
      // junto com os módulos embedded.
      moduleOptions: manifest.moduleOptions || {},
    };
  }

  onInstall() {
    console.log(`${this.manifest.name} installed successfully`);
  }

  getManifest() {
    return this.manifest;
  }

  getTranslations() {
    return this.manifest.translations;
  }

  getComponents() {
    return this.manifest.components;
  }

  getEntryComponent() {
    return this.manifest.componentsEntry;
  }

  getDependencies() {
    return this.manifest.dependencies;
  }
}
