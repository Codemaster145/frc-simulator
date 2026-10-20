// Serve the production output exactly at the GitHub Pages project path.
// Missing assets return 404 rather than Vite's SPA HTML fallback.
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';

const root = resolve('dist');
const base = '/frc-simulator/';
const port = Number(process.env.PORT || 5198);
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.webmanifest':'application/manifest+json', '.glb':'model/gltf-binary', '.bin':'application/octet-stream', '.wasm':'application/wasm', '.png':'image/png', '.svg':'image/svg+xml', '.txt':'text/plain' };

createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(base)) { res.writeHead(404).end(); return; }
  const name = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html';
  const file = resolve(root, name);
  if (!file.startsWith(root + sep)) { res.writeHead(404).end(); return; }
  let stat;
  try { stat = statSync(file); } catch { res.writeHead(404).end(); return; }
  if (!stat.isFile()) { res.writeHead(404).end(); return; }
  const ext = file.slice(file.lastIndexOf('.'));
  res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Content-Length': stat.size });
  if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Pages build: http://127.0.0.1:${port}${base}`));
