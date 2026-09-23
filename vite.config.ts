import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src")
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Hausblick",
        short_name: "Hausblick",
        description: "Organisations-App für Ihr Zuhause – sichtbar machen, was wirklich erledigt wurde.",
        theme_color: "#F5F1E7",
        background_color: "#F5F1E7",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
        ]
      }
    })
  ]
});
