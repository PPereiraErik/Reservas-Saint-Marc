import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Caminhos relativos: o build funciona na raiz de um domínio (Vercel, Netlify)
  // e também em subpastas, como no GitHub Pages (usuario.github.io/salao-premium).
  base: "./",
  server: {
    port: 5173,
    open: true,
  },
});
