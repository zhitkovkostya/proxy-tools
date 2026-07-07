import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  // Relative paths so assets resolve under any GitHub Pages subpath.
  base: "./",
  plugins: [tailwindcss(), react()],
  resolve: {
    tsconfigPaths: true,
  },
});
