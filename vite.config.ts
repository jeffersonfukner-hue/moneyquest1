import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
