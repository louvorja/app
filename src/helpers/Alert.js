import $dev from "@/helpers/Dev";
import $appdata from "@/helpers/AppData";
import store from "@/store";

export default {
  show(data, callback = function () {}) {
    data = this.getData(data);

    $dev.write("dialog", data, typeof data, Array.isArray(data));

    $appdata.set("alert.value", "");
    $appdata.set("alert.show", true);
    $appdata.set("alert.title", data.title || null);
    $appdata.set("alert.text", data.text || null);
    $appdata.set("alert.error", data.error || null);
    $appdata.set("alert.color", data.color || "");
    $appdata.set(
      "alert.translate",
      data.translate == null || data.translate == undefined ? true : data.translate
    );
    $appdata.set(
      "alert.buttons",
      data.buttons || [{ text: "alert.close", color: "error", value: "close" }]
    );

    const unwatch = store.watch(
      (state) => state.alert.show,
      (show) => {
        if (!show) {
          unwatch();
          callback($appdata.get("alert.value"));
        }
      }
    );
  },

  yesno(data, callback = function () {}) {
    data = this.getData(data);

    this.show(
      {
        ...data,
        buttons: [
          { text: "alert.no", color: "error", value: "no" },
          { text: "alert.yes", color: "info", value: "yes" },
        ],
      },
      (resp, ret) => {
        callback(resp, ret);
      }
    );
  },

  info(data, callback = function () {}) {
    data = this.getData(data);

    this.show(
      {
        ...data,
        buttons: [{ text: "alert.close", color: "error", value: "close" }],
      },
      (resp, ret) => {
        callback(resp, ret);
      }
    );
  },

  error(data, callback = function () {}) {
    data = this.getData(data);

    this.show(
      {
        ...data,
        buttons: [{ text: "alert.close", color: "error", value: "close" }],
      },
      (resp, ret) => {
        callback(resp, ret);
      }
    );
  },

  getData(data) {
    if (typeof data == "string") {
      data = { text: data };
    } else if (Array.isArray(data)) {
      data = {
        title: data[0] ?? null,
        text: data[1] ?? null,
      };
    }

    return data;
  },
};
