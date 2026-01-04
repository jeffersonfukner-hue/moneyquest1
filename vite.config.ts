import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-512x512.png", "pwa-192x192.png"],
      manifest: {
        name: "MoneyQuest",
        short_name: "MoneyQuest",
        description: "App financeiro gamificado para controle de gastos, desafios e recompensas.",
        theme_color: "#3D2A5D",
        background_color: "#1a1625",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["finance", "productivity"],
        lang: "pt-BR",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/maskable-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core vendor - absolute minimum for first load
          if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router-dom')) {
            return 'vendor-core';
          }
          // Supabase client - needed for auth
          if (id.includes('@supabase/')) {
            return 'vendor-supabase';
          }
          // i18n - needed for language support
          if (id.includes('i18next') || id.includes('react-i18next')) {
            return 'vendor-i18n';
          }
          // UI components - Radix primitives
          if (id.includes('@radix-ui/')) {
            return 'vendor-ui';
          }
          // Charts - heavy, only for reports/dashboard
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'vendor-charts';
          }
          // Forms - for auth and data entry
          if (id.includes('react-hook-form') || id.includes('@hookform/') || id.includes('zod')) {
            return 'vendor-forms';
          }
          // Date utilities
          if (id.includes('date-fns')) {
            return 'vendor-date';
          }
          // TanStack Query
          if (id.includes('@tanstack/')) {
            return 'vendor-query';
          }
          // Framer motion / animations (if present)
          if (id.includes('framer-motion')) {
            return 'vendor-motion';
          }
          // Canvas confetti (gamification)
          if (id.includes('canvas-confetti')) {
            return 'vendor-effects';
          }
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 300,
  },
}));
