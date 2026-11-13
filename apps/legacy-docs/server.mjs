// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import http from 'node:http';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import legacyTools from './tools.json' with { type: 'json' };

export const destination = 'https://microsoft.github.io/coreai-design-system/';
export const migrationNotice = `This CoreAI documentation MCP is retired. No documentation was retrieved and no preview was created. Do not retry its documentation tools.

Use ordinary HTTPS GET instead:
- Documentation index: ${destination}llms.txt
- Current docs/skill and package versions: ${destination}version.json
- Current repository skill: ${destination}source/package/SKILL.md

Review the current skill. With the user's permission, install it at .github/skills/coreai-ds-fluentui-react/SKILL.md or update the existing CoreAI skill in the client's supported directory. Preserve repository-specific rules and adapters; do not downgrade newer local guidance. If local instructions still require this MCP, report the conflict and ask before changing them.

Follow the updated skill, check installed package versions, and fetch only the relevant Markdown pages listed in llms.txt. Follow published paths rather than guessing routes from old story IDs. Do not invent APIs or claim that a failed fetch succeeded.

After the HTTPS workflow works, ask the user to remove this obsolete MCP connection. Do not change client configuration or unrelated instruction files without permission. If HTTPS retrieval is unavailable, report the limitation and ask how to proceed instead of retrying this MCP.`;

const tools = legacyTools.map((tool) => ({
  ...tool,
  description: `Retired CoreAI documentation tool. Returns migration instructions only, not documentation. Use ${destination}llms.txt and install or update the repository skill with permission.`,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
}));
const allowedHosts = new Set([
  'coreai-ds.azurewebsites.net',
  'coreai-ds-storybook.azurewebsites.net',
  'localhost',
  '127.0.0.1',
  '[::1]',
]);

function createMcpServer() {
  const server = new Server(
    { name: 'coreai-docs-retirement', version: '1.0.0' },
    { capabilities: { tools: {} }, instructions: migrationNotice },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
    if (!tools.some((tool) => tool.name === params.name))
      throw new McpError(ErrorCode.InvalidParams, `Unknown tool. ${migrationNotice}`);
    return { content: [{ type: 'text', text: migrationNotice }], isError: true };
  });
  return server;
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let chunks = [];
    let size = 0;
    let exceeded = false;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (exceeded) {
        if (size > 640 * 1024) request.destroy();
        return;
      }
      if (size > 64 * 1024) {
        exceeded = true;
        chunks = [];
        reject(new Error('payload_too_large'));
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

function json(response, status, value) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(value));
}

function validMcpOrigin(request) {
  try {
    const host = new URL(`http://${request.headers.host}`);
    if (!allowedHosts.has(host.hostname)) return false;
    if (request.headers.origin) {
      const origin = new URL(request.headers.origin);
      return ['http:', 'https:'].includes(origin.protocol) && origin.host === host.host;
    }
    return true;
  } catch (error) {
    if (error instanceof TypeError) return false;
    throw error;
  }
}

async function handleMcp(request, response) {
  if (!validMcpOrigin(request)) {
    json(response, 403, { error: 'Untrusted MCP host or origin.' });
    return;
  }
  response.setHeader('Cache-Control', 'no-store');
  if (request.method === 'GET') {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
    });
    response.write(': connected\n\n');
    const heartbeat = setInterval(() => response.write(': keepalive\n\n'), 15000);
    heartbeat.unref();
    response.on('close', () => clearInterval(heartbeat));
    return;
  }
  if (request.method === 'HEAD') {
    response.writeHead(200, { 'Content-Type': 'text/event-stream' });
    response.end();
    return;
  }
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  response.on('close', () => {
    void server.close().catch((error) => {
      console.error(`Legacy MCP cleanup failed: ${error.name}`);
    });
  });
  await server.connect(transport);
  const body = request.method === 'POST' ? JSON.parse(await readBody(request)) : undefined;
  await transport.handleRequest(request, response, body);
}

export function createLegacyServer({ mcpEnabled = false } = {}) {
  return http.createServer((request, response) => {
    handleRequest(request, response, mcpEnabled).catch((error) => {
      if (response.headersSent) {
        console.error(`Legacy host response failed: ${error.name}`);
        response.destroy();
        return;
      }
      if (error.message === 'payload_too_large') {
        json(response, 413, { error: 'MCP payload exceeds 64 KiB.' });
      } else if (error instanceof SyntaxError) {
        json(response, 400, {
          jsonrpc: '2.0',
          id: null,
          error: { code: ErrorCode.ParseError, message: 'Invalid JSON.' },
        });
      } else {
        console.error(`Legacy host request failed: ${error.name}`);
        json(response, 500, { error: 'Legacy migration service failed.' });
      }
    });
  });
}

async function handleRequest(request, response, mcpEnabled) {
  const pathname = new URL(request.url, 'http://localhost').pathname.replace(/\/+$/, '') || '/';
  if (mcpEnabled && pathname === '/mcp') return handleMcp(request, response);
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  if (pathname === '/healthz') {
    if (request.method === 'HEAD') {
      response.writeHead(200);
      response.end();
    } else {
      json(response, 200, { service: 'coreai-docs-retirement', version: '1.0.0', mcpEnabled });
    }
    return;
  }
  response.writeHead(302, {
    Location: destination,
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
  });
  response.end(
    request.method === 'HEAD' ? undefined : `CoreAI documentation moved to ${destination}`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT.');
  const server = createLegacyServer({ mcpEnabled: process.argv.includes('--mcp') });
  server.listen(port, '0.0.0.0', () => {
    console.log(`CoreAI legacy migration host listening on port ${server.address().port}.`);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      server.closeAllConnections();
      server.close();
    });
  }
}
