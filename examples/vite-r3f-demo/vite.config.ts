import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  optimizeDeps: {
    exclude: ["@moritzbrantner/r3f-vector-effects"],
  },
});
