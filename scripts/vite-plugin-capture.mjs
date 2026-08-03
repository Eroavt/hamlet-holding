import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Dev-only screenshot sink.
 *
 * The page POSTs a data URL to /__capture and it lands in .captures/. Used to
 * review WebGL states frame-accurately during development — a headless canvas
 * cannot be judged from the DOM, and stepping the timeline by hand in a real
 * browser does not scale.
 *
 * Never registered in a production build.
 */
export function capturePlugin(outDir = '.captures') {
  return {
    name: 'hhg-capture',
    apply: 'serve',
    configureServer(server) {
      const dir = join(server.config.root, outDir);
      mkdirSync(dir, { recursive: true });

      server.middlewares.use('/__capture', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end('POST only');
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            const { name, dataUrl } = JSON.parse(body);
            const safe = String(name).replace(/[^a-z0-9._-]/gi, '_');
            const base64 = String(dataUrl).split(',')[1] ?? '';
            const file = join(dir, safe.endsWith('.png') ? safe : `${safe}.png`);
            writeFileSync(file, Buffer.from(base64, 'base64'));
            res.setHeader('content-type', 'application/json');
            res.end(JSON.stringify({ ok: true, file }));
          } catch (err) {
            res.statusCode = 400;
            res.end(String(err));
          }
        });
      });
    },
  };
}
