import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./game', import.meta.url));
const portFlag = process.argv.indexOf('--port');
const port = portFlag < 0 ? 8080 : Number(process.argv[portFlag + 1]);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }
  const file = resolve(root, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
  if (!file.startsWith(root + sep)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const stat = statSync(file);
    if (!stat.isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      'content-type': types[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'content-length': stat.size,
    });
    createReadStream(file).on('error', () => response.destroy()).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => console.log(`Solmar Bay is on http://localhost:${port}`));
