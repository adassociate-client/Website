import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // The design kit's CSS targets bare `img` elements (`.cn-gallery img`,
      // `.image-box-header img`). next/image would wrap them in extra markup
      // and inline styles, so plain <img> is deliberate here.
      "@next/next/no-img-element": "off",
    },
  },
];
