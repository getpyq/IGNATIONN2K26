import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../server/app.ts';

const app = createApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
