// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

// Public production host for the complete Storybook build and its stateless MCP endpoint.
import http from 'node:http';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, 'storybook-static');
const port = Number(process.env.PORT || 8080);
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};
const compressibleTypes = new Set(['.css', '.html', '.js', '.json', '.map', '.svg', '.txt']);
let mcpHandlerPromise;

function getMcpHandler() {
  mcpHandlerPromise ??= (async () => {
    const { createStorybookMcpHandler } = await import('@storybook/mcp');
    return createStorybookMcpHandler({
      manifestProvider: async (_request, manifestPath) =>
        readFile(path.join(rootDir, manifestPath.replace(/^\.\//, '')), 'utf8'),
    });
  })();
  return mcpHandlerPromise;
}

function resolvePath(pathname) {
  const decoded = decodeURIComponent(pathname);
  const file = path.resolve(rootDir, `.${decoded === '/' ? '/index.html' : decoded}`);
  if (!file.startsWith(`${rootDir}${path.sep}`)) return null;
  return path.extname(file) ? file : path.join(file, 'index.html');
}

function readRequestBody(request, limit = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    let exceeded = false;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (exceeded) {
        if (size > limit * 10) request.destroy();
        return;
      }
      if (size > limit) {
        exceeded = true;
        chunks = [];
        reject(new Error('payload_too_large'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
}

async function handleMcp(request, response, pathname) {
  const body = !['GET', 'HEAD'].includes(request.method)
    ? await readRequestBody(request)
    : undefined;
  const host = request.headers.host || 'localhost';
  const url = `http://${host}${pathname}${new URL(request.url, `http://${host}`).search}`;
  const headers = new Headers();
  for (const [key, value] of Object.entries(request.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  const webResponse = await (
    await getMcpHandler()
  )(
    new Request(url, {
      method: request.method,
      headers,
      body: body?.length ? body : undefined,
    }),
  );
  response.statusCode = webResponse.status;
  webResponse.headers.forEach((value, key) => response.setHeader(key, value));
  if (!webResponse.body) return response.end();
  await pipeline(Readable.fromWeb(webResponse.body), response);
}

function serveStatic(request, response, pathname) {
  const file = resolvePath(pathname);
  if (!file) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Invalid path.');
    return;
  }
  fs.readFile(file, (error, buffer) => {
    if (error) {
      if (error.code !== 'ENOENT' && error.code !== 'EISDIR') {
        process.stderr.write(`Static file read failed: ${error.code}\n`);
        response.writeHead(500);
        response.end('Server error.');
        return;
      }
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found.');
      return;
    }
    const extension = path.extname(file);
    const headers = {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    };
    const send = (payload) => {
      response.writeHead(200, headers);
      response.end(request.method === 'HEAD' ? undefined : payload);
    };
    if (
      compressibleTypes.has(extension) &&
      (request.headers['accept-encoding'] || '').includes('gzip')
    ) {
      zlib.gzip(buffer, (error, compressed) => {
        if (error) {
          process.stderr.write(`Static compression failed: ${error.message}\n`);
          send(buffer);
          return;
        }
        headers['Content-Encoding'] = 'gzip';
        headers.Vary = 'Accept-Encoding';
        send(compressed);
      });
      return;
    }
    send(buffer);
  });
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    if (error?.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
    process.stderr.write(`Request handler error: ${error?.stack || error}\n`);
    if (!response.headersSent)
      response.writeHead(error.message === 'payload_too_large' ? 413 : 500);
    response.end(error.message === 'payload_too_large' ? 'Payload too large.' : 'Server error.');
  });
});

async function handleRequest(request, response) {
  const host = request.headers.host || 'localhost';
  const pathname = new URL(request.url, `http://${host}`).pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/mcp') return handleMcp(request, response, pathname);
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  serveStatic(request, response, pathname);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(port, () => {
    process.stdout.write(`Public Storybook host listening on http://localhost:${port}\n`);
    process.stdout.write(`Public MCP endpoint at http://localhost:${port}/mcp\n`);
  });
}
export { server };
