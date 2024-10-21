import { Elysia, t } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/hello', () => 'Brisa from Elysia entrypoint')
  .post('/', ({ body }) => body, {
    body: t.Object({
      name: t.String(),
    }),
  });

export const GET = app.handle;
export const POST = app.handle;
