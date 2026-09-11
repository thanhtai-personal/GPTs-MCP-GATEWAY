import path from "node:path";
import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: webRoot,
  resolve: {
    alias: {
      "@": path.join(webRoot, "src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    tsconfigPaths: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5656,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 5656,
    strictPort: true,
  },
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro(),
    react(),
  ],
});
