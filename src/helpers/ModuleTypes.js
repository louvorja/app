// @/helpers/ModuleTypes.js
export const ModuleManifest = {
  create(options) {
    // Add validation
    const required = ["id", "name", "version"];
    for (const field of required) {
      if (!options[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      id: options.id,
      name: options.name,
      version: options.version,
      description: options.description,
      author: options.author,
      category: options.category || "misc",
      icon: options.icon,
      minAppVersion: options.minAppVersion || "1.0.0",
      dependencies: options.dependencies || [],
    };
  },
};

export class BaseModule {
  constructor(manifest) {
    this.manifest = manifest;
    this.config = manifest.config || {};
  }

  // eslint-disable-next-line no-unused-vars
  async install(app, context) {
    // Abstract method to be implemented by specific Modules
    throw new Error("Module must implement install method");
  }

  // eslint-disable-next-line no-unused-vars
  async uninstall(context) {
    // Optional uninstall method
  }

  getConfig() {
    return this.config;
  }

  setConfig(config) {
    this.config = { ...this.config, ...config };
  }

  // Utility methods for module developers
  registerComponent(app, component, name) {
    app.component(name || component.name, component);
  }

  registerRoute(router, route) {
    router.addRoute(route);
  }

  registerStoreModule(store, module) {
    store.registerModule(this.manifest.id, module);
  }
}
