import { chromium } from 'playwright';
import fs from 'node:fs';
const svg = fs.readFileSync('public/icons/icon.svg','utf8');
const browser = await chromium.launch();
try {
 const page = await browser.newPage();
 for (const [name,size] of [['apple-touch-icon.png',180],['icon-192.png',192],['icon-512.png',512]]) {
  await page.setViewportSize({width:size,height:size});
  await page.setContent('<html><body style="margin:0">'+svg.replace(/width="512" height="512"/,'width="'+size+'" height="'+size+'"')+'</body></html>');
  await page.screenshot({path:'public/icons/'+name});
 }
} finally { await browser.close(); }
