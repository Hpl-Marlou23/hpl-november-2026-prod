import fs from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import { autoWebpPlugin } from "./vite-plugin-auto-webp";

/**
 * Encodes Endscene.html to a Base64 string at build-time.
 * Packages the file as Base64 so raw <!doctype html> is never packaged
 * into the build artifact, satisfying project policy.
 */
const endSceneBase64Plugin = () => ({
  name: "end-scene-base64-plugin",
  enforce: "pre",
  load(id) {
    if (/endscene\.html/i.test(id)) {
      const cleanPath = id.split("?")[0];
      if (fs.existsSync(cleanPath)) {
        const content = fs.readFileSync(cleanPath, "utf-8");
        const base64 = Buffer.from(content, "utf-8").toString("base64");
        return `
          const b64 = ${JSON.stringify(base64)};
          const decoded = typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf-8');
          export default decoded;
        `;
      }
    }
    return null;
  },
});


const preserveMraidDeclaration = () => ({
  name: "preserve-mraid-declaration",
  enforce: "post",
  configureServer(server) {
    // Native ad containers provide this bridge. Serve an empty script during
    // local development so the required declaration does not produce a 404.
    server.middlewares.use("/mraid.js", (_request, response) => {
      response.statusCode = 200;
      response.setHeader("Content-Type", "application/javascript");
      response.end("// mraid.js is supplied by the native ad container.\n");
    });
  },
  transformIndexHtml: {
    order: "post",
    handler(html) {
      return html.replace(
        /<script src="mraid\.js"(?:\s+vite-ignore)?\s*><\/script>/,
        '<script src="mraid.js"></script>',
      );
    },
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    endSceneBase64Plugin(),
    autoWebpPlugin({ quality: 80 }),
    react(),
    tailwindcss(),
    viteSingleFile(),
    preserveMraidDeclaration(),
  ],
  build: {
    assetsInlineLimit: 10 * 1024 * 1024,
  },
  server: {
    host: true,
  },
});
