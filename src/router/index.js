import { createRouter, createWebHashHistory, createWebHistory } from "vue-router";
import Popup from "@/views/Popup.vue";

const routes = [
  {
    path: "/",
    name: "Shell",
    component: () => import("@/views/Shell.vue"),
  },
  {
    path: "/popup",
    name: "Popup",
    component: Popup,
  },
  {
    path: "/projection",
    name: "Projection",
    component: () => import("@/views/Projection.vue"),
  },
  {
    path: "/projection/return",
    name: "ProjectionReturn",
    component: () => import("@/views/ProjectionReturn.vue"),
  },
  {
    path: "/obs",
    name: "Obs",
    component: () => import("@/views/Obs.vue"),
  },
  {
    path: "/clock",
    name: "Clock",
    component: () => import("@/views/Clock.vue"),
  },
  {
    path: "/operator",
    name: "Operator",
    component: () => import("@/views/Operator.vue"),
  },
  {
    path: "/obs/bible",
    name: "ObsBible",
    component: () => import("@/views/ObsBible.vue"),
  },
  {
    path: "/projection/bible",
    name: "ProjectionBible",
    component: () => import("@/views/ProjectionBible.vue"),
  },
  {
    path: "/projection/module",
    name: "ModuleProjection",
    component: () => import("@/views/ModuleProjection.vue"),
  },
];

// Em Electron prod o app é servido via file:// (legacy) ou louvorja://app
// (atual) — vue-router NÃO consegue usar history mode em ambos (não há
// servidor pra reescrever rotas), então cai pra hash mode. No web/PWA
// (http/https) mantém history (URLs limpas).
const isLocalProtocol =
  typeof window !== "undefined" && ["file:", "louvorja:"].includes(window.location.protocol);

const router = createRouter({
  history: isLocalProtocol
    ? createWebHashHistory()
    : createWebHistory(import.meta.env.BASE_URL ?? "/"),
  routes,
});

export default router;
