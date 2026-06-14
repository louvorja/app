import $dev from "@/helpers/Dev";
import $appdata from "@/helpers/AppData";

export default {
  open(id) {
    if (!this.check(id)) {
      console.error(`Módulo ${id} não encontrado!`);
      return;
    }
    $dev.write("open", id);
    $appdata.set(`modules.${id}.show`, true);
  },
  close(id) {
    if (!this.check(id)) {
      console.error(`Módulo ${id} não encontrado!`);
      return;
    }
    $dev.write("close", id);
    $appdata.set(`modules.${id}.show`, false);

    //Remove da TrayArea
    this.removeTray(id);
  },
  minimize(id) {
    if (!this.check(id)) {
      console.error(`Módulo ${id} não encontrado!`);
      return;
    }
    if ($appdata.get(`modules.${id}.title`, "") == "") {
      console.error(`Módulo ${id} não possui a prorpiedade "title"!`);
      return;
    }
    if ($appdata.get(`modules.${id}.icon`, "") == "") {
      console.error(`Módulo ${id} não possui a prorpiedade "icon"!`);
      return;
    }
    $dev.write("minimize", id);
    $appdata.set(`modules.${id}.show`, false);

    //Adiciona na TrayArea
    this.addTray(id);
  },
  get(list = null) {
    if (list == null) {
      return $appdata.get("modules");
    }

    if (typeof list == "string") {
      return $appdata.get(`modules.${list}`);
    }

    if (!list || list.length <= 0) {
      return {};
    }

    try {
      return {
        ...Object.fromEntries(
          list.map((module) => {
            const data = $appdata.get(`modules.${module}`);
            return [
              module,
              data ? { id: module, ...data } : {
                invalid: true,
                title: "modules.invalid.title",
                icon: "mdi-alert-circle-outline",
              },
            ];
          })
        ),
      };
    } catch {
      return {};
    }
  },
  addTray(id) {
    if (!this.check(id)) {
      console.error(`Módulo ${id} não encontrado!`);
      return;
    }
    $appdata.addElement(`tray_area.modules`, id);
  },
  removeTray(id) {
    if (!this.check(id)) {
      console.error(`Módulo ${id} não encontrado!`);
      return;
    }
    $appdata.removeElement(`tray_area.modules`, id);
  },
  getTray() {
    return this.get($appdata.get("tray_area.modules"));
  },
  setTray(data) {
    return $appdata.set("tray_area.modules", data);
  },

  getMenu() {
    return this.get($appdata.get("menu.modules"));
  },

  getGroups() {
    const module_group = JSON.parse(
      JSON.stringify($appdata.get("module_group") || {})
    );
    Object.keys(module_group).forEach((key) => {
      if (module_group[key].modules?.length <= 0) {
        module_group[key].modules = {};
      }

      module_group[key].modules = this.get(module_group[key].modules || []);
    });
    return module_group;
  },

  check(id) {
    return $appdata.exists(`modules.${id}`);
  },

  sort(modules, $t) {
    return Object.entries(modules)
      .sort(([, v1], [, v2]) => {
        const t1 = v1?.title ? $t(v1.title).toLowerCase() : "";
        const t2 = v2?.title ? $t(v2.title).toLowerCase() : "";
        return t1.localeCompare(t2);
      })
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  },
};
