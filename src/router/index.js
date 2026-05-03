import { createRouter, createWebHistory } from "vue-router";
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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL ?? "/"),
  routes,
});

export default router;
