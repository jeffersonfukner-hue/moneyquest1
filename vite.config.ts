import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Asset version for cache busting PWA icons
const ASSET_VERSION = new Date().toISOString().slice(0, 10).replace(/-/g, '');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    'import.meta.env.VITE_BUILD_VERSION': JSON.stringify(`v${new Date().toISOString().slice(0, 10).replace(/-/g, '.')}`),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "prompt",
      injectRegister: "auto",
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-512x512.png", "pwa-192x192.png"],
      manifest: {
        name: "MoneyQuest",
        short_name: "MoneyQuest",
        description: "App financeiro gamificado para controle de gastos, desafios e recompensas.",
        theme_color: "#3D2A5D",
        background_color: "#1a1625",
        // IMPORTANT: display mode only affects the *installed* app. Browsing via URL stays as web.
        // Using minimal-ui reduces the chance of Chrome pushing users into an app-like experience.
        display: "minimal-ui",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["finance", "productivity"],
        lang: "pt-BR",
        icons: [
          {
            src: `/pwa-192x192.png?v=${ASSET_VERSION}`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `/pwa-512x512.png?v=${ASSET_VERSION}`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `/maskable-icon.png?v=${ASSET_VERSION}`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,ico,png,svg,webp,woff2}"],
        globIgnores: ["**/pwa-*.png", "**/maskable-icon.png", "**/apple-touch-icon.png"],
      },
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
          // Charts (recharts/d3) - let Vite handle bundling to avoid TDZ issues
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
