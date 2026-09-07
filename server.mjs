import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./site/', import.meta.url));
const port = Number(process.env.PORT || 5173);
const base = '/' + (process.env.BASE_PATH || '').replace(/^\/+|\/+$/g, '') + '/';
const basePath = base === '//' ? '/' : base;
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.ttf': 'font/ttf', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8',
};
const server = http.createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' }); response.end('Method not allowed'); return;
  }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, 'http://local.invalid').pathname); }
  catch { response.writeHead(400); response.end('Bad request'); return; }
  if (basePath !== '/' && pathname === basePath.slice(0, -1)) {
    response.writeHead(302, { Location: basePath }); response.end(); return;
  }
  if (!pathname.startsWith(basePath)) { response.writeHead(404); response.end('Not found'); return; }
  const relative = pathname.slice(basePath.length) || 'index.html';
  const filename = path.resolve(root, relative);
  if (!filename.startsWith(root) || filename.includes('\0')) {
    response.writeHead(403); response.end('Forbidden'); return;
  }
  try {
    if (!(await stat(filename)).isFile()) throw new Error('Not a file');
    const content = await readFile(filename);
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Content-Length': content.length });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); response.end('Not found'); }
});
server.listen(port, '0.0.0.0', () => console.log(`SecondLook is ready at http://0.0.0.0:${port}${basePath}`));
