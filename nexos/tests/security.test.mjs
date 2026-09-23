import test from 'node:test';
import assert from 'node:assert/strict';
import { issueStatusToken, verifyStatusToken } from '../src/lib/status-token.ts';
import { matchesWebhookSecret } from '../src/lib/webhook-auth.ts';
import { summarizePayments } from '../src/lib/payment-status.ts';
import { readJsonBody, isSameOrigin } from '../src/lib/request-security.ts';

process.env.CHECKOUT_STATUS_SECRET = 'test-only-secret-'.repeat(4);

test('request limits reject oversized chunks without trusting Content-Length', async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(65))); },
    cancel() { cancelled = true; },
  });
  const request = new Request('http://localhost/api', { method: 'POST', body: stream, duplex: 'half' });
  await assert.rejects(readJsonBody(request, 64), { status: 413 });
  assert.equal(cancelled, true);
});

test('JSON limits count UTF-8 bytes and reject malformed JSON', async () => {
  await assert.rejects(readJsonBody(new Request('http://localhost', { method: 'POST', body: '"ááá"' }), 7), { status: 413 });
  await assert.rejects(readJsonBody(new Request('http://localhost', { method: 'POST', body: '{' })), { status: 400 });
  assert.deepEqual(await readJsonBody(new Request('http://localhost', { method: 'POST', body: '{"ok":true}' })), { ok: true });
});

test('same-origin protection rejects missing, foreign and cross-site origins', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = 'https://nexos.example';
  try {
    const make = headers => new Request('https://nexos.example/api/auth/login', { headers });
    assert.equal(isSameOrigin(make({ Origin: 'https://nexos.example' })), true);
    assert.equal(isSameOrigin(make({})), false);
    assert.equal(isSameOrigin(make({ Origin: 'https://attacker.example' })), false);
    assert.equal(isSameOrigin(make({ Origin: 'https://nexos.example', 'Sec-Fetch-Site': 'cross-site' })), false);
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = previous;
  }
});

test('installments require every charge to settle and aggregate the original amount', () => {
  const first = { id: 'one', status: 'CONFIRMED', value: 3.33, billingType: 'CREDIT_CARD' };
  const second = { ...first, id: 'two', status: 'PENDING', value: 3.34 };
  assert.equal(summarizePayments([first, second]).paid, false);
  const result = summarizePayments([first, { ...second, status: 'RECEIVED', originalValue: 3.34, value: 4 }]);
  assert.equal(result.paid, true);
  assert.equal(result.value, 6.67);
  assert.equal(summarizePayments([]).paid, false);
  assert.equal(summarizePayments([{ ...first, status: 'REFUNDED' }]).status, 'REFUNDED');
});

test('status token binds a reference, survives process state loss, and expires', async () => {
  const now = 1800000000000;
  const { token } = issueStatusToken('nexos-order-one', now);
  assert.equal(verifyStatusToken('nexos-order-one', token, now), true);
  assert.equal(verifyStatusToken('nexos-order-two', token, now), false);
  assert.equal(verifyStatusToken('nexos-order-one', token, now + 86400000), false);
  const freshModule = await import('../src/lib/status-token.ts?fresh');
  assert.equal(freshModule.verifyStatusToken('nexos-order-one', token, now), true);
});

test('tampered, malformed and missing status tokens are rejected', () => {
  const now = 1800000000000;
  const { token } = issueStatusToken('order', now);
  for (const value of [undefined, '', '.', token + '.extra', '9999999999.' + token.split('.')[1], 'x'.repeat(200)]) {
    assert.equal(verifyStatusToken('order', value, now), false);
  }
});

test('missing signing configuration fails before creating a payment', () => {
  const saved = process.env.CHECKOUT_STATUS_SECRET;
  const savedSupabase = process.env.SUPABASE_SECRET_KEY;
  delete process.env.CHECKOUT_STATUS_SECRET;
  delete process.env.SUPABASE_SECRET_KEY;
  assert.throws(() => issueStatusToken('order'));
  process.env.CHECKOUT_STATUS_SECRET = saved;
  if (savedSupabase) process.env.SUPABASE_SECRET_KEY = savedSupabase;
});

test('webhook authentication rejects missing, wrong and oversized credentials', () => {
  assert.equal(matchesWebhookSecret('secret', 'secret'), true);
  assert.equal(matchesWebhookSecret(null, 'secret'), false);
  assert.equal(matchesWebhookSecret('secret', undefined), false);
  assert.equal(matchesWebhookSecret('wrong', 'secret'), false);
  assert.equal(matchesWebhookSecret('x'.repeat(1025), 'secret'), false);
});
