import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        manager: resolve(__dirname, "manager.html"),
        popup: resolve(__dirname, "popup.html")
      }
    }
  }
});
