import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUT = "/cursor/stores/self/media/blanco";
const ART = "/opt/cursor/artifacts/screenshots";
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(ART, { recursive: true });

function save(pagePath, buf) {
  fs.writeFileSync(path.join(OUT, pagePath), buf);
  fs.writeFileSync(path.join(ART, pagePath), buf);
  console.log("saved", pagePath);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "uk-UA",
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

await page.goto("http://127.0.0.1:3847/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
save("01-home.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/catalog", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
save("02-catalog.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/product/sveter-shevchenko", {
  waitUntil: "networkidle",
});
await page.waitForTimeout(500);
// pick size M if available
const sizeM = page.getByRole("button", { name: /^M$/ });
if (await sizeM.count()) await sizeM.first().click();
await page.getByRole("button", { name: /В кошик/i }).click();
await page.waitForTimeout(400);
save("03-pdp.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/cart", { waitUntil: "networkidle" });
await page.waitForTimeout(400);
save("04-cart.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/checkout", { waitUntil: "networkidle" });
await page.fill("#name", "Богдан Тест");
await page.fill("#phone", "+380501112233");
await page.fill("#email", "demo@blanco.ua");
await page.fill("#city", "Київ");
await page.fill("#address", "вул. Хрещатик 1");
await page.fill("#np", "12");
// card fields by placeholder
await page.getByPlaceholder("4242 4242 4242 4242").fill("4242424242424242");
await page.getByPlaceholder("12/28").fill("12/28");
await page.getByPlaceholder("123").fill("123");
save("05-checkout.png", await page.screenshot({ fullPage: false }));

await page.getByRole("button", { name: /Оплатити/i }).click();
await page.waitForURL(/\/account\/orders\//, { timeout: 15000 });
await page.waitForTimeout(600);
save("06-order-success.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/admin", { waitUntil: "networkidle" });
await page.waitForTimeout(700);
save("07-admin-orders.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: /Підтримка|Відкрити підтримку/i }).click();
await page.waitForTimeout(400);
await page.getByPlaceholder("Ваше питання…").fill("Як доставка?");
await page.getByRole("button", { name: /Надіслати/i }).click();
await page.waitForTimeout(900);
save("08-support-chat.png", await page.screenshot({ fullPage: false }));

await page.goto("http://127.0.0.1:3847/wishlist", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
save("09-wishlist.png", await page.screenshot({ fullPage: false }));

const video = page.video();
await context.close();
await browser.close();
if (video) {
  const vpath = await video.path();
  const dest = path.join(OUT, "walkthrough-checkout.webm");
  fs.renameSync(vpath, dest);
  fs.copyFileSync(dest, path.join("/opt/cursor/artifacts", "walkthrough-checkout.webm"));
  console.log("video", dest);
}
console.log("done");
