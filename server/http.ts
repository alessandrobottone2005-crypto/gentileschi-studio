import type { IncomingMessage, ServerResponse } from 'node:http';

/** The Node HTTP surface used by Vercel handlers and the local API adapter. */
export interface ApiRequest extends IncomingMessage {
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
}

export interface ApiResponse extends ServerResponse {
  status(code: number): this;
  json(body: unknown): this;
}
