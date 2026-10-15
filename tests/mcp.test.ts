import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { loadBundle } from '../src/lib/load.ts';

// Drives the real server over stdio against the repository's own data.
let child: ReturnType<typeof spawn>;
const pending = new Map<number, (v: any) => void>();
let buffer = '';
let nextId = 1;

function rpc(method: string, params?: unknown): Promise<any> {
  const id = nextId++;
  child.stdin!.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`);
  return new Promise((resolve) => pending.set(id, resolve));
}

beforeAll(() => {
  const dir = mkdtempSync(join(tmpdir(), 'icc-mcp-'));
  const file = join(dir, 'bundle.json');
  writeFileSync(file, JSON.stringify(loadBundle(process.cwd(), 'https://example.test/')));
  child = spawn(process.execPath, ['mcp/server.ts'], { env: { ...process.env, ICC_DATA_URL: file }, stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout!.setEncoding('utf8');
  child.stdout!.on('data', (chunk: string) => {
    buffer += chunk;
    let i;
    while ((i = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, i);
      buffer = buffer.slice(i + 1);
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      pending.get(msg.id)?.(msg);
      pending.delete(msg.id);
    }
  });
});

afterAll(() => child?.kill());

describe('mcp server', () => {
  it('initializes with the requested protocol version', async () => {
    const r = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
    expect(r.result.protocolVersion).toBe('2025-06-18');
    expect(r.result.capabilities.tools).toBeTruthy();
    expect(r.result.serverInfo.name).toBe('india-compliance-calendar');
  });

  it('lists its tools with input schemas', async () => {
    const r = await rpc('tools/list');
    const names = r.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(['upcoming_obligations', 'get_obligation', 'search_obligations', 'event_deadlines', 'check_date', 'list_holidays', 'regulatory_updates']),
    );
    for (const t of r.result.tools) expect(t.inputSchema.type).toBe('object');
  });

  it('answers upcoming_obligations for a 24-month horizon, sorted by exposure', async () => {
    const r = await rpc('tools/call', { name: 'upcoming_obligations', arguments: { horizon: 'custom', months: 24, sort: 'exposure', limit: 10 } });
    expect(r.result.isError).toBe(false);
    const body = r.result.structuredContent;
    expect(body.items.length).toBeGreaterThan(0);
    const exp = body.items.map((x: { exposure30: number }) => x.exposure30);
    expect(exp).toEqual([...exp].sort((a: number, b: number) => b - a));
  });

  it('reports user errors as tool errors, not protocol errors', async () => {
    const r = await rpc('tools/call', { name: 'get_obligation', arguments: { id: 'does-not-exist' } });
    expect(r.result.isError).toBe(true);
  });

  it('rejects unknown methods', async () => {
    const r = await rpc('nope/nothing');
    expect(r.error.code).toBe(-32601);
  });
});
