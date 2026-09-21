import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    /*
    |--------------------------------------------------------------------------
    | COOP header fix for Firebase Google Sign-In popup
    |--------------------------------------------------------------------------
    |
    | "same-origin" (Vite's default) blocks the Google auth popup from
    | posting its result back to this window, causing signInWithPopup to
    | silently fail. "same-origin-allow-popups" permits popups that this
    | page opened (like the Google OAuth window) to communicate back.
    |
    |--------------------------------------------------------------------------
    */
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
    },

    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        secure: false
      }
    }
  }
});