import react from "@astrojs/react";
import node from "@astrojs/node";
import emdash, { local } from "emdash/astro";
import { sqlite } from "emdash/db";
import { defineConfig } from "astro/config";

const base = process.env.PUBLIC_BASE_PATH ?? "/";
const site = process.env.SITE_URL;

export default defineConfig({
  site,
  base,
  output: "server",
  trailingSlash: "ignore",
  publicDir: "./static",
  adapter: node({ mode: "standalone" }),
  integrations: [
    react(),
    emdash({
      database: sqlite({ url: process.env.DATABASE_URL ?? "file:./data.db" }),
      storage: local({
        directory: process.env.EMDASH_UPLOADS_DIR ?? "./uploads",
        baseUrl: "/_emdash/api/media/file",
      }),
      updateCheck: false,
    }),
  ],
  devToolbar: { enabled: false },
  vite: {
    server: {
      allowedHosts: ["localhost"],
    },
  },
});
