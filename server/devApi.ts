import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ApiRequest, ApiResponse } from './http';

const routes: Record<string, string> = {
  '/api/account': '/api/account.ts',
  '/api/ai/generate': '/api/ai/generate.ts',
  '/api/photos': '/api/photos.ts',
};
const maxBodyBytes = 64 * 1024;
type Handler = (request: ApiRequest, response: ApiResponse) => unknown;

/** Run the same authenticated handlers locally that Vercel runs in production. */
export function createDevApiMiddleware(loadHandler: (file: string) => Promise<{ default: Handler }>) {
  return async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
    const url = new URL(request.url || '/', 'http://localhost');
    const modulePath = routes[url.pathname];
    if (!modulePath) return next();

    const req = request as ApiRequest;
    const res = response as ApiResponse;
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (value) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(value));
      return res;
    };
    res.setHeader('Cache-Control', 'private, no-store');
    req.query = {};
    for (const key of new Set(url.searchParams.keys())) {
      const values = url.searchParams.getAll(key);
      req.query[key] = values.length === 1 ? values[0] : values;
    }

    try {
      const chunks: Buffer[] = [];
      let bytes = 0;
      let tooLarge = false;
      for await (const chunk of req) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        bytes += buffer.length;
        if (bytes > maxBodyBytes) tooLarge = true;
        if (!tooLarge) chunks.push(buffer);
      }
      if (tooLarge) return res.status(413).json({ error: 'Richiesta troppo grande.' });
      const body = Buffer.concat(chunks).toString('utf8');
      try {
        req.body = body ? JSON.parse(body) : {};
      } catch {
        return res.status(400).json({ error: 'Richiesta JSON non valida.' });
      }
      const { default: handler } = await loadHandler(modulePath);
      await handler(req, res);
    } catch {
      if (!res.headersSent) res.status(503).json({ error: 'Servizio non disponibile. Riprova più tardi.' });
      else if (!res.writableEnded) res.end();
    }
  };
}
