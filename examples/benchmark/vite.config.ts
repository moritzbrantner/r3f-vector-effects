import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      {
        find: "@moritzbrantner/r3f-vector-effects/experimental/tsl",
        replacement: new URL("../../src/experimental/tsl.ts", import.meta.url).pathname,
      },
      {
        find: "@moritzbrantner/r3f-vector-effects",
        replacement: new URL("../../src/index.ts", import.meta.url).pathname,
      },
    ],
  },
  server: {
    host: "0.0.0.0",
  },
});
