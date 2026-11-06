import http from 'node:http';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { Readable } from 'node:stream';
import worker from './dist/server/index.js';
    
const sqlite = new DatabaseSync('practice.sqlite');
if (!sqlite.prepare("SELECT name FROM sqlite_master WHERE name = 'quiz_attempts'").get()) {
  sqlite.exec(readFileSync(new URL('./drizzle/0000_curious_loners.sql', import.meta.url), 'utf8'));
}
const DB = {
  prepare(sql) {
    const statement = sqlite.prepare(sql);
    return { bind(...args) {
      return {
        first: () => statement.get(...args) ?? null,
        all: () => ({ results: statement.all(...args) }),
        run: () => ({ meta: { changes: Number(statement.run(...args).changes) } })
      };
    }};
  }
};
const port = Number(process.env.PORT || 4173);
const origin = 'http://127.0.0.1:' + port;
http.createServer(async (incoming, outgoing) => {
  try {
    if (incoming.headers.host !== '127.0.0.1:' + port) {
      outgoing.writeHead(403).end();
      return;
    }
    const headers = new Headers(incoming.headers);
    headers.set('oai-authenticated-user-id', 'local-sailor');
    const init = { method: incoming.method, headers };
    if (incoming.method === 'POST') Object.assign(init, {body: Readable.toWeb(incoming), duplex: 'half'});
    const result = await worker.fetch(new Request(new URL(incoming.url, origin), init), { DB });
    outgoing.writeHead(result.status, Object.fromEntries(result.headers));
    outgoing.end(Buffer.from(await result.arrayBuffer()));
  } catch (error) {
    console.error(error.message);
    outgoing.writeHead(500).end();
  }
}).listen(port, '127.0.0.1', () => console.log(origin));
