// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

// Vuetify
import { createVuetify } from "vuetify";

// Paleta de cores da identidade visual oficial da Igreja Adventista do
// Sétimo Dia (Manual Prático de Marca): a cor institucional adotada pela
// Divisão Sul-Americana para materiais oficiais, mais as cores sugeridas
// pela Associação Geral para uso institucional.
// Fonte: Manual-Pratico-de-Marca-Versao1ponto2.pdf
const BRAND = {
  navy: "#003366", // Cor institucional (Divisão Sul-Americana)
  denim: "#2f557f",
  ming: "#3e8391",
  treeFrog: "#448d21",
  warm: "#ffa92d",
  emperor: "#4b207f",
  grapevine: "#7f264a",
  earth: "#5e3929",
  cool: "#4d7549",
};

export default createVuetify({
  theme: {
    defaultTheme: "darkblue",
    themes: {
      light: {
        dark: false,
        colors: {
          primary: BRAND.denim,
        },
      },
      darkblue: {
        dark: false,
        colors: {
          primary: BRAND.navy,
        },
      },
      blue: {
        dark: false,
        colors: {
          primary: BRAND.ming,
        },
      },
      green: {
        dark: false,
        colors: {
          primary: BRAND.treeFrog,
        },
      },
      orange: {
        dark: false,
        colors: {
          primary: BRAND.warm,
        },
      },
      purple: {
        dark: false,
        colors: {
          primary: BRAND.emperor,
        },
      },
      pink: {
        dark: false,
        colors: {
          primary: BRAND.grapevine,
        },
      },
      black: {
        dark: false,
        colors: {
          primary: BRAND.earth,
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: BRAND.cool,
        },
      },
    },
  },
});
