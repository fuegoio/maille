import { createPinia } from "pinia";
import { createApp } from "vue";
import { MotionPlugin } from "@vueuse/motion";

import { registerDesignSystem } from "./components/designSystem";

import App from "./App.vue";
import router from "./router";
import { initSentry } from "./lib/sentry";

import "@mdi/font/css/materialdesignicons.css";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import "./index.css";
import "inter-ui/inter.css";

const app = createApp(App);

registerDesignSystem(app);
initSentry(app, router);

app.use(createPinia());
app.use(router);

app.use(MotionPlugin);

app.mount("#app");
