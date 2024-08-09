import { createRouter, createWebHistory } from "vue-router";
import MainLayout from "@/layouts/MainLayout.vue";
import HomePage from "@/pages/HomePage.vue";
import CustomerPage from "@/pages/CustomerPage.vue";
import RiderPage from "@/pages/RiderPage.vue";
import BoosPage from "@/pages/BoosPage.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "mainLayout",
      component: MainLayout,
      children: [
        {
          path: "",
          name: "home",
          component: HomePage,
        },
        {
          path: "/customer",
          name: "customer",
          component: CustomerPage,
        },
        {
          path: "/rider",
          name: "rider",
          component: RiderPage,
        },
        {
          path: "/boss",
          name: "boss",
          component: BoosPage,
        },
      ],
    },
  ],
});

export default router;
