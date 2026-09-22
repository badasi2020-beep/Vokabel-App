import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Gemeinsam",
        short_name: "Gemeinsam",
        description: "Was wurde im Haushalt wirklich gemacht – gemeinsam sichtbar.",
        theme_color: "#F6F1E7",
        background_color: "#F6F1E7",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icon-512.svg", sizes: "512x512", type: "image/svg+xml" }
        ]
      }
    })
  ]
});
