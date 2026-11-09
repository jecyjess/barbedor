// Après `vite build` de l'édition SC : nom de l'application dans le manifeste et le titre.
import { readFileSync, writeFileSync } from "node:fs";
const dir = process.argv[2] || "dist-sc";
const m = JSON.parse(readFileSync(`${dir}/manifest.webmanifest`, "utf8"));
m.name = "VTC Facture SC";
m.short_name = "VTC Facture SC";
writeFileSync(`${dir}/manifest.webmanifest`, JSON.stringify(m, null, 2));
const html = readFileSync(`${dir}/index.html`, "utf8").replace("<title>VTC Facture</title>", "<title>VTC Facture SC</title>");
writeFileSync(`${dir}/index.html`, html);
console.log("Édition SC prête dans", dir);
