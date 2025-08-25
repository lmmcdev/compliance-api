import { app } from '@azure/functions';
import { accountsGetByIdHandler as handler } from '../modules/account/account.routes';

test('GET /accounts/{id} -> 404 envelope', async () => {
  const req = { method: 'GET', url: 'http://x/api/v1/accounts/abc', params: { id: 'abc' } } as any;
  const ctx = { invocationId: 'test-trace' } as any;

  const res = await handler(req, ctx);
  expect(res.status).toBe(404);
  expect(res.jsonBody).toMatchObject({
    success: false,
    error: { code: 'NOT_FOUND' },
    meta: { traceId: 'test-trace' },
  });
});
