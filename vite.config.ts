import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'node:https';

function ttsPlugin(): Plugin {
  return {
    name: 'tts-service-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const text = url.searchParams.get('text') || '';
        const lang = url.searchParams.get('lang') || 'te';

        if (!text) {
          res.statusCode = 400;
          res.end('Missing text parameter');
          return;
        }

        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

        const request = https.get(
          googleUrl,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          },
          (googleRes) => {
            res.writeHead(googleRes.statusCode || 200, {
              'Content-Type': googleRes.headers['content-type'] || 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*'
            });
            googleRes.pipe(res);
          }
        );

        request.on('error', (err) => {
          console.error('TTS proxy error:', err);
          res.statusCode = 502;
          res.end('TTS gateway error');
        });
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', (req, res) => {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const text = url.searchParams.get('text') || '';
        const lang = url.searchParams.get('lang') || 'te';

        if (!text) {
          res.statusCode = 400;
          res.end('Missing text parameter');
          return;
        }

        const googleUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;

        const request = https.get(
          googleUrl,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          },
          (googleRes) => {
            res.writeHead(googleRes.statusCode || 200, {
              'Content-Type': googleRes.headers['content-type'] || 'audio/mpeg',
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*'
            });
            googleRes.pipe(res);
          }
        );

        request.on('error', () => {
          res.statusCode = 502;
          res.end('TTS gateway error');
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), ttsPlugin()],
  server: {
    port: 3000,
    host: true,
    open: false
  },
  preview: {
    port: 3000,
    host: true
  }
});
