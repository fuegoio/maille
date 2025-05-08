import pluginVue from "eslint-plugin-vue";
import vueTsEslintConfig from "@vue/eslint-config-typescript";
import skipFormattingConfig from "@vue/eslint-config-prettier/skip-formatting";
import js from "@eslint/js";

export default [
  ...pluginVue.configs["flat/recommended"],
  js.configs.recommended,
  ...vueTsEslintConfig(),
  skipFormattingConfig,
];
