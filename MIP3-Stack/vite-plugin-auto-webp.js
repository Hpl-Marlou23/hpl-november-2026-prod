import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/**
 * Vite plugin that intercepts imported images (.png, .jpg, .jpeg) during `vite build`,
 * converts them to optimized .webp using ffmpeg, and delivers the WebP buffer to Vite
 * so that inline base64 encoding produces ultra-compact WebP data URIs.
 */
export function autoWebpPlugin(options = {}) {
  const quality = options.quality ?? 80;
  const isImageRegex = /\.(png|jpe?g)$/i;

  return {
    name: "vite-plugin-auto-webp-base64",
    enforce: "pre",
    apply: "build",

    async load(id) {
      const cleanPath = id.split("?")[0];
      if (!isImageRegex.test(cleanPath)) return null;
      if (!fs.existsSync(cleanPath)) return null;

      try {
        const parsed = path.parse(cleanPath);
        // Place converted webp in a hidden cache directory inside src/assets/.webp_cache
        const cacheDir = path.join(parsed.dir, ".webp_cache");
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }

        const webpPath = path.join(cacheDir, `${parsed.name}.webp`);
        const srcStat = fs.statSync(cleanPath);

        // Convert if webp cache doesn't exist or source is newer
        let needsConvert = true;
        if (fs.existsSync(webpPath)) {
          const webpStat = fs.statSync(webpPath);
          if (webpStat.mtimeMs >= srcStat.mtimeMs && webpStat.size > 0) {
            needsConvert = false;
          }
        }

        if (needsConvert) {
          await execFileAsync("ffmpeg", [
            "-y",
            "-i",
            cleanPath,
            "-c:v",
            "libwebp",
            "-lossless",
            "0",
            "-quality",
            String(quality),
            webpPath,
          ]);
          console.log(`[auto-webp] Converted ${parsed.base} -> ${parsed.name}.webp`);
        }

        // Return as inline base64 WebP data URI
        const webpBuffer = fs.readFileSync(webpPath);
        const base64 = `data:image/webp;base64,${webpBuffer.toString("base64")}`;
        return `export default ${JSON.stringify(base64)};`;
      } catch (err) {
        console.warn(`[auto-webp] Warning: Failed to convert ${cleanPath} to webp, falling back to original:`, err.message);
        return null;
      }
    },
  };
}
