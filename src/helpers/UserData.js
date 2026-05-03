import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";

let _saveTimer = null;

export default {
  save() {
    clearTimeout(_saveTimer);
    _saveTimer = setTimeout(() => {
      $dev.write("salvando dados");
      $storage.set("user_data", $appdata.get("user_data"));
    }, 300);
  },
  load() {
    $dev.write("carregando dados");
    let data = $appdata.flatten($storage.get("user_data"));

    Object.keys(data).map((item) => {
      $appdata.set(`user_data.${item}`, data[item]);
    });
  },

  set(param, value) {
    $dev.write("set userdata", { param, value });
    $appdata.set(`user_data.${param}`, value);

    //Salvar os Dados
    this.save();
  },

  setIfNull(param, value) {
    $dev.write("set userdata", { param, value });
    if (
      $appdata.get(`user_data.${param}`) === null ||
      $appdata.get(`user_data.${param}`) === undefined
    ) {
      $appdata.set(`user_data.${param}`, value);
    }
  },

  get(param, ifnull = null) {
    //$dev.write("get userdata", { param, ifnull });
    if (!param) {
      return $appdata.get("user_data", ifnull);
    }
    return $appdata.get(`user_data.${param}`, ifnull);
  },
};
