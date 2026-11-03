import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Plugin hỗ trợ Proxy gọi Google Apps Script khi chạy npm run dev ở môi trường local.
 * Ở môi trường Production (Vercel), request /api/gas-proxy sẽ được xử lý bởi Serverless Function api/gas-proxy.ts.
 */
function gasProxyPlugin(): Plugin {
  return {
    name: 'gas-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/gas-proxy', (req, res) => {
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', async () => {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          try {
            const parsed = JSON.parse(body || '{}');
            const targetUrl = String(parsed.gasUrl || '').trim();
            const method = parsed.method || 'POST';
            const payload = parsed.payload;

            if (!targetUrl) {
              res.end(JSON.stringify({ ok: false, error: 'Chưa có URL Google Apps Script' }));
              return;
            }

            const fetchOptions: RequestInit = {
              method,
              redirect: 'follow',
              headers: {
                'Content-Type': 'text/plain;charset=utf-8',
                Accept: 'application/json, text/plain, */*',
              },
            };
            if (method === 'POST' && payload) {
              fetchOptions.body = JSON.stringify(payload);
            }

            const gasResponse = await fetch(targetUrl, fetchOptions);
            const rawText = await gasResponse.text();

            if (gasResponse.status === 403 || gasResponse.status === 401) {
              res.end(
                JSON.stringify({
                  ok: false,
                  error:
                    'Lỗi quyền truy cập (HTTP 403): Trong Google Apps Script, mục "Ai có quyền truy cập (Who has access)" đang để là "Chỉ mình tôi". Hãy đổi thành "Bất kỳ ai (Anyone)"!',
                })
              );
              return;
            }

            try {
              const json = JSON.parse(rawText);
              res.end(JSON.stringify(json));
            } catch {
              res.end(
                JSON.stringify({
                  ok: false,
                  error: `Phản hồi không phải JSON từ Apps Script (HTTP ${gasResponse.status}).`,
                })
              );
            }
          } catch (err) {
            res.end(
              JSON.stringify({
                ok: false,
                error: `Lỗi kết nối tới Google Apps Script: ${
                  err instanceof Error ? err.message : String(err)
                }`,
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig({
  base: '/',
  plugins: [react(), tailwindcss(), gasProxyPlugin()],
  server: {
    port: 5173,
    host: true,
  },
});
