/**
 * Gera standalone/reservas-saint-marc.html: um único arquivo com todo o HTML, CSS e
 * JavaScript embutidos. Pode ser aberto com dois cliques, sem servidor.
 *
 * Uso: npm run build:standalone   (roda o build do Vite antes)
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const read = (path) => readFileSync(join(dist, path.replace(/^\.?\//, "")), "utf8");

let html = read("index.html");

// JavaScript: troca <script src="..."> pelo código embutido.
html = html.replace(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/g,
  (_, src) => `<script type="module">${read(src).replaceAll("</script", "<\\/script")}</script>`,
);

// CSS: troca <link rel="stylesheet" href="./assets/..."> pelo estilo embutido.
html = html.replace(
  /<link rel="stylesheet" crossorigin href="(\.\/assets\/[^"]+)">/g,
  (_, href) => `<style>${read(href)}</style>`,
);

// Favicon embutido como data URI.
const favicon = Buffer.from(read("favicon.svg")).toString("base64");
html = html.replace('href="./favicon.svg"', `href="data:image/svg+xml;base64,${favicon}"`);

if (/src="\.\/assets|href="\.\/assets/.test(html)) {
  console.error("Algum arquivo não foi embutido. Verifique o dist/index.html.");
  process.exit(1);
}

mkdirSync(join(root, "standalone"), { recursive: true });
writeFileSync(join(root, "standalone", "reservas-saint-marc.html"), html);
console.log("Pronto: standalone/reservas-saint-marc.html");
