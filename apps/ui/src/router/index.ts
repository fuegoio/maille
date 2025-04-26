import { storeToRefs } from "pinia";
import { createRouter, createWebHistory } from "vue-router";

import { useSettingsStore } from "@/stores/settings";

import LoginView from "@/views/auth/LoginView.vue";
import LoadingDataView from "@/views/LoadingDataView.vue";

import SettingsView from "@/views/settings/SettingsView.vue";
import SettingsAccountsView from "@/views/settings/SettingsAccountsView.vue";
import SettingsActivityCategoriesView from "@/views/settings/SettingsActivityCategoriesView.vue";

import MovementsView from "@/views/MovementsView.vue";
import ActivitiesView from "@/views/ActivitiesView.vue";
import CategoryView from "@/views/CategoryView.vue";
import DashboardView from "@/views/DashboardView.vue";
import PeriodsView from "@/views/periods/PeriodsView.vue";
import PeriodView from "@/views/periods/PeriodView.vue";
import NotFoundView from "@/views/NotFoundView.vue";
import ProjectsView from "@/views/projects/ProjectsView.vue";
import ProjectView from "@/views/projects/ProjectView.vue";
import LiabilitiesView from "@/views/LiabilitiesView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: LoginView,
    },
    {
      path: "/loading",
      name: "loading",
      component: LoadingDataView,
    },

    {
      path: "/",
      name: "dashboard",
      component: DashboardView,
    },

    {
      path: "/periods",
      name: "periods",
      component: PeriodsView,
    },
    {
      path: "/periods/:period",
      name: "period",
      component: PeriodView,
    },

    {
      path: "/projects",
      name: "projects",
      component: ProjectsView,
    },
    {
      path: "/projects/:id",
      name: "project",
      component: ProjectView,
    },

    {
      path: "/activities/:id?",
      name: "activities",
      component: ActivitiesView,
    },
    {
      path: "/category/:name?",
      name: "category",
      component: CategoryView,
    },
    {
      path: "/movements/:id?",
      name: "movements",
      component: MovementsView,
    },
    {
      path: "/liabilities",
      name: "liabilities",
      component: LiabilitiesView,
    },

    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
      beforeEnter: (to, from, next) => {
        const { previousRoute } = storeToRefs(useSettingsStore());
        if (!previousRoute.value && !to.path.includes("settings_")) {
          previousRoute.value = from;
        }
        next();
      },
    },
    {
      path: "/settings/account",
      name: "settings_accounts",
      component: SettingsAccountsView,
    },
    {
      path: "/settings/categories",
      name: "settings_categories",
      component: SettingsActivityCategoriesView,
    },

    { path: "/:pathMatch(.*)*", name: "not-found", component: NotFoundView },
  ],
});

export default router;
