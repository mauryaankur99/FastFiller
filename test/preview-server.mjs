import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PORT = 8942;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '/popup') reqPath = '/src/popup/index.html';
  if (reqPath === '/help') reqPath = '/src/help/index.html';

  const filePath = path.join(ROOT, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';

  let content = fs.readFileSync(filePath);

  // If serving popup index.html in standalone browser, inject a safe mock chrome object for testing
  if (reqPath.endsWith('index.html')) {
    const htmlStr = content.toString('utf-8');
    const mockScript = `
    <script>
      if (!window.chrome || !window.chrome.storage) {
        const mockStore = {};
        window.chrome = {
          storage: {
            local: {
              get: (keys, cb) => {
                const out = {};
                const list = Array.isArray(keys) ? keys : [keys];
                for (const k of list) if (k in mockStore) out[k] = mockStore[k];
                setTimeout(() => cb(out), 10);
              },
              set: (items, cb) => {
                Object.assign(mockStore, items);
                if (cb) setTimeout(cb, 10);
              }
            }
          },
          tabs: {
            query: async () => [{ id: 1, url: 'https://example.com/checkout' }],
            sendMessage: (id, msg, cb) => {
              if (msg.type === 'COLLECT_DATA') {
                cb({
                  success: true,
                  inputs: [
                    { class: 'form-filler-0-0', labelText: 'Full Name', type: 'text', isVisible: true },
                    { class: 'form-filler-0-1', labelText: 'Email Address', type: 'email', isVisible: true },
                    { class: 'form-filler-0-2', labelText: 'Phone Number', type: 'tel', isVisible: true },
                    { class: 'form-filler-0-3', labelText: 'Country', type: 'select', isVisible: true, options: ['United States', 'Canada', 'United Kingdom'] },
                    { class: 'form-filler-0-4', labelText: 'Address Line 1', type: 'text', isVisible: true },
                    { class: 'form-filler-0-5', labelText: 'City', type: 'text', isVisible: true },
                    { class: 'form-filler-0-6', labelText: 'Postal / ZIP Code', type: 'text', isVisible: true }
                  ]
                });
              } else if (msg.type === 'FILL_FORM') {
                cb({
                  success: true,
                  fillResults: {
                    'form-filler-0-0': { success: true },
                    'form-filler-0-1': { success: true },
                    'form-filler-0-2': { success: true },
                    'form-filler-0-3': { success: true },
                    'form-filler-0-4': { success: true },
                    'form-filler-0-5': { success: true },
                    'form-filler-0-6': { success: true }
                  }
                });
              } else if (msg.type === 'UNDO_FILL') {
                cb({ success: true, restoredCount: 7 });
              } else if (msg.type === 'PING') {
                cb({ success: true, pong: true });
              } else if (msg.type === 'HIGHLIGHT_FIELD') {
                cb({ success: true });
              } else {
                cb({ success: true });
              }
            },
            create: (opts) => { console.log('Mock tab created:', opts); }
          },
          runtime: {
            getURL: (p) => '/' + p.replace(/^\\/+/, ''),
            lastError: null
          }
        };
      }
    </script>
    `;
    const injected = htmlStr.replace('<head>', '<head>' + mockScript);
    content = Buffer.from(injected);
  }

  res.writeHead(200, { 'Content-Type': contentType });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`FastFiller Preview Server running on http://localhost:${PORT}`);
});
