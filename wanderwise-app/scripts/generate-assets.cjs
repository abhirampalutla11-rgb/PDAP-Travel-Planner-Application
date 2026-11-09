const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const root = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const assets = path.join(root, "assets");
fs.mkdirSync(assets, { recursive: true });

async function build() {
  const icon = fs.readFileSync(path.join(assets, "brand-mark.svg"));
  const foreground = fs.readFileSync(path.join(assets, "brand-mark-foreground.svg"));
  await sharp(icon).resize(1024, 1024).png().toFile(path.join(assets, "icon.png"));
  await sharp(icon).resize(512, 512).png().toFile(path.join(assets, "splash.png"));
  await sharp(foreground).resize(432, 432).png().toFile(path.join(assets, "adaptive-icon.png"));
  console.log("Generated WanderWise icon, splash, and adaptive icon assets.");
}
build().catch(error => { console.error(error); process.exit(1); });
