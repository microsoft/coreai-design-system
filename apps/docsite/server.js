// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT || 8080);
const registry = JSON.parse(fs.readFileSync(path.join(rootDir, 'site-registry.json'), 'utf8'));
const knownRoutes = new Set(registry.pages.map(({ slug }) => normalizeRoute(slug)));
const routeRedirects = new Map(
  (registry.redirects || []).map(({ from, to }) => [normalizeRoute(from), to]),
);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.otf': 'font/otf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const compressibleTypes = new Set(['.css', '.html', '.js', '.json', '.md', '.svg', '.txt']);
const compressedCache = new Map();

function resolvePath(urlPathname) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(urlPathname);
  } catch {
    return null;
  }

  const safePath = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, '');
  const joinedPath = safePath === '/' ? '/index.html' : safePath;
  const filePath = path.join(rootDir, joinedPath);

  if (filePath !== rootDir && !filePath.startsWith(`${rootDir}${path.sep}`)) {
    return null;
  }

  if (path.extname(filePath)) {
    return filePath;
  }

  return path.join(filePath, 'index.html');
}

function normalizeRoute(urlPathname) {
  if (urlPathname === '/') {
    return '/';
  }
  return urlPathname.replace(/\/+$/, '');
}

function cacheControlFor(filePath) {
  const basename = path.basename(filePath);
  const extension = path.extname(filePath);
  if (
    extension === '.html' ||
    extension === '.md' ||
    basename === 'site-registry.json' ||
    basename === 'changelog.json' ||
    basename === 'llms.txt' ||
    basename === 'llms-full.txt'
  ) {
    return 'no-cache';
  }
  if (/-[A-Za-z0-9_-]{8,}\.[^.]+$/.test(basename)) {
    return 'public, max-age=31536000, immutable';
  }
  return 'public, max-age=3600, must-revalidate';
}

function writeResponse(request, response, status, headers, buffer) {
  response.writeHead(status, {
    ...headers,
    'Content-Length': buffer.length,
  });
  response.end(request.method === 'HEAD' ? undefined : buffer);
}

function acceptedEncoding(header) {
  const qualities = new Map(
    header.split(',').map((part) => {
      const [name, ...parameters] = part.trim().toLowerCase().split(';');
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith('q='));
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.trim().slice(2)) : 1;
      return [name, Number.isFinite(quality) ? quality : 0];
    }),
  );
  const wildcard = qualities.get('*') ?? 0;
  const brotli = qualities.get('br') ?? wildcard;
  const gzip = qualities.get('gzip') ?? wildcard;
  if (brotli <= 0 && gzip <= 0) {
    return null;
  }
  return brotli >= gzip ? 'br' : 'gzip';
}

function sendBuffer(request, response, status, headers, buffer, cacheKey) {
  const extension = path.extname(cacheKey);
  if (!compressibleTypes.has(extension)) {
    writeResponse(request, response, status, headers, buffer);
    return;
  }

  const encoding = acceptedEncoding(request.headers['accept-encoding'] || '');

  if (!encoding) {
    writeResponse(
      request,
      response,
      status,
      {
        ...headers,
        Vary: 'Accept-Encoding',
      },
      buffer,
    );
    return;
  }

  const encodedCacheKey = `${cacheKey}:${encoding}`;
  const cached = compressedCache.get(encodedCacheKey);
  if (cached) {
    writeResponse(
      request,
      response,
      status,
      {
        ...headers,
        'Content-Encoding': encoding,
        Vary: 'Accept-Encoding',
      },
      cached,
    );
    return;
  }

  const done = (error, compressed) => {
    if (error) {
      writeResponse(
        request,
        response,
        status,
        {
          ...headers,
          Vary: 'Accept-Encoding',
        },
        buffer,
      );
      return;
    }
    compressedCache.set(encodedCacheKey, compressed);
    writeResponse(
      request,
      response,
      status,
      {
        ...headers,
        'Content-Encoding': encoding,
        Vary: 'Accept-Encoding',
      },
      compressed,
    );
  };

  if (encoding === 'br') {
    zlib.brotliCompress(
      buffer,
      {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 5,
        },
      },
      done,
    );
    return;
  }
  zlib.gzip(buffer, done);
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestUrl.pathname;

  const redirectTarget = routeRedirects.get(normalizeRoute(pathname));
  if (redirectTarget) {
    response.writeHead(308, {
      Location: `${redirectTarget}${requestUrl.search}`,
      'Cache-Control': 'no-cache',
    });
    response.end();
    return;
  }

  if (pathname === '/healthz') {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    writeResponse(
      request,
      response,
      200,
      {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
      Buffer.from(JSON.stringify({ status: 'ok' })),
    );
    return;
  }

  const resolvedPath = resolvePath(pathname);

  if (!resolvedPath) {
    response.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Invalid path.');
    return;
  }

  fs.readFile(resolvedPath, (error, buffer) => {
    if (error) {
      // Serve the app shell for extension-less routes so React can render
      // either the requested page or its not-found UI.
      if (!path.extname(pathname) && pathname !== '/index.html') {
        fs.readFile(path.join(rootDir, 'index.html'), (fallbackError, fallbackBuffer) => {
          if (fallbackError) {
            response.writeHead(404, {
              'Content-Type': 'text/plain; charset=utf-8',
            });
            response.end('Not found.');
            return;
          }
          const status = knownRoutes.has(normalizeRoute(pathname)) ? 200 : 404;
          sendBuffer(
            request,
            response,
            status,
            {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-cache',
            },
            fallbackBuffer,
            path.join(rootDir, 'index.html'),
          );
        });
        return;
      }
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found.');
      return;
    }

    const extension = path.extname(resolvedPath);
    const headers = {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': cacheControlFor(resolvedPath),
    };

    sendBuffer(request, response, 200, headers, buffer, resolvedPath);
  });
});

server.listen(port, () => {
  process.stdout.write(`Docsite listening on http://localhost:${port}\n`);
});
