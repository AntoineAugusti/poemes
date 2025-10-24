import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";

export default defineConfig([
	{ files: ["js.js"], languageOptions: { globals: globals.browser } },
	{ files: ["js.js"], plugins: { js }, extends: ["js/recommended"] },
]);
