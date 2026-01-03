import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "src/public"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, "src/public/index.html"),
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src/dist"),
    },
  },
});
