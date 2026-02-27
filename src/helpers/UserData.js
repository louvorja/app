import $dev from "@/helpers/Dev";
import $storage from "@/helpers/Storage";
import $appdata from "@/helpers/AppData";

export default {
  save() {
    $dev.write("salvando dados");
    /*if (store.state.desktop) {
          // SE FOR APLICAÇÃO DESKTOP, SALVA AS CONFIGURAÇÕES NA MAQUINA DO USUARIO
          IPC.send('save_data', JSON.stringify(store.state.data));
      }*/

    //Salvar no Storage
    $storage.set("user_data", $appdata.get("user_data"));
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

    //Salvar os Dados
    this.save();
  },

  get(param, ifnull = null) {
    //$dev.write("get userdata", { param, ifnull });
    if (!param) {
      return $appdata.get("user_data", ifnull);
    }
    return $appdata.get(`user_data.${param}`, ifnull);
  },
};
