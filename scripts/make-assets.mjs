// One-off: converts screenshots to WebP and creates the placeholder image. Run: node scripts/make-assets.mjs
import fs from "node:fs";
import sharp from "sharp";

const dir = "public/screenshots";
for (const f of fs.readdirSync(dir)) {
  if (!/\.(png|jpe?g)$/i.test(f)) continue;
  const out = `${dir}/${f.replace(/\.(png|jpe?g)$/i, ".webp")}`;
  const info = await sharp(`${dir}/${f}`).webp({ quality: 82 }).toFile(out);
  fs.unlinkSync(`${dir}/${f}`);
  console.log(out, `${info.width}x${info.height}`, `${(info.size / 1024).toFixed(0)}KB`);
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
<rect width="800" height="450" fill="#0b1220"/><rect x="1" y="1" width="798" height="448" rx="6" fill="none" stroke="#1e293b" stroke-width="2" stroke-dasharray="10 8"/>
<g fill="none" stroke="#64748b" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"><rect x="340" y="165" width="120" height="90" rx="10"/><circle cx="375" cy="195" r="10"/><path d="M345 245l35-30 25 20 20-15 30 25"/></g></svg>`;
const info = await sharp(Buffer.from(svg)).webp({ quality: 80 }).toFile(`${dir}/placeholder.webp`);
console.log("placeholder.webp", `${info.width}x${info.height}`);
