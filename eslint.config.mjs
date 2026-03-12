import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import nextOnPagesPlugin from "eslint-plugin-next-on-pages";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      "next-on-pages": nextOnPagesPlugin,
    },
    rules: {
      "next-on-pages/no-unsupported-configs": "warn",
    },
  },
];

export default eslintConfig;
