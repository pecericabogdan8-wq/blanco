import sharp from "sharp";
import fs from "fs";
import path from "path";

const dir = "public/products";
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".webp"));

async function main() {
  const rows: { name: string; w: number; h: number; kb: number }[] = [];
  for (const f of files) {
    const full = path.join(dir, f);
    const m = await sharp(full).metadata();
    rows.push({
      name: f,
      w: m.width ?? 0,
      h: m.height ?? 0,
      kb: Math.round(fs.statSync(full).size / 1024),
    });
  }
  rows.sort((a, b) => a.w * a.h - b.w * b.h);
  console.table(rows.slice(0, 25));
  console.log("--- largest px ---");
  console.table(rows.slice(-8));
}

main();
