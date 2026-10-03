import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { checkoutHref, checkoutLoginHref, checkoutQuantity, formatCpfCnpj, parseCheckoutPayment } from '../src/lib/checkout.ts';
import { loadCheckoutOrder } from '../src/lib/checkout-order.ts';
import { verifyStatusToken } from '../src/lib/status-token.ts';

process.env.CHECKOUT_STATUS_SECRET = 'checkout-unit-test-secret-'.repeat(4);
const key = 'e6e355c6-0c60-4511-aef4-83b7e428fc36';
const reference = 'nexos-test-owned-order';
const payment = { externalReference: reference, statusToken: 'test-status-token', paymentId: 'pay_test', paymentUrl: 'https://sandbox.asaas.com/i/test', amount: 6990, currency: 'brl', billingType: 'CREDIT_CARD', installments: 1 };

function database() {
  const calls = [];
  const tables = {
    idempotency_keys: [{ key_hash: createHash('sha256').update(key).digest('hex'), owner_id: 'owner-one', status: 'succeeded', result: payment, provider_reference: reference }],
    orders: [{ owner_id: 'owner-one', product_id: 'placa', quantity: 1, amount_cents: 6990, status: 'processing', external_reference: reference, payment_id: 'pay_test', private_payer: 'never return this' }],
  };
  return { tables, calls, client: { from(table) {
    const filters = [];
    return { select(columns) { calls.push({ table, columns, filters }); return this; }, eq(column, value) { filters.push([column, value]); return this; }, async maybeSingle() { return { data: tables[table].find(row => filters.every(([column, value]) => row[column] === value)) ?? null, error: null }; } };
  } } };
}

test('checkout URLs preserve product/quantity and reject invalid quantities', () => {
  for (const value of [0, -1, 51, 1.5, Infinity, 'wrong']) assert.equal(checkoutQuantity(value), 1);
  assert.equal(checkoutQuantity('50'), 50);
  assert.equal(checkoutHref('placa', 3), '/checkout?product=placa&quantity=3');
  assert.equal(new URL(checkoutLoginHref('placa', 3), 'https://nexos.test').searchParams.get('callbackUrl'), '/checkout?product=placa&quantity=3');
  assert.equal(formatCpfCnpj('12345678909'), '123.456.789-09');
  assert.equal(formatCpfCnpj('12345678000195'), '12.345.678/0001-95');
});

test('payment URLs reject injected schemes and lookalike provider domains', () => {
  assert.ok(parseCheckoutPayment(payment));
  for (const paymentUrl of ['javascript:alert(1)', 'https://asaas.com.evil.test/i/test', 'http://sandbox.asaas.com/i/test', 'https://user@asaas.com/i/test']) assert.equal(parseCheckoutPayment({ ...payment, paymentUrl }), null);
  assert.equal(parseCheckoutPayment({ ...payment, amount: -1 }), null);
});

test('recovery scopes every database read to the owner and refreshes signed status credentials', async () => {
  const db = database();
  const snapshot = await loadCheckoutOrder(db.client, 'owner-one', { key });
  assert.equal(snapshot.payment.amount, 6990);
  assert.ok(verifyStatusToken(reference, snapshot.credentials.statusToken));
  assert.equal(JSON.stringify(snapshot).includes('never return this'), false);
  assert.ok(db.calls.every(call => call.filters.some(([column, value]) => column === 'owner_id' && value === 'owner-one')));
});

test('a known reference/key cannot recover another account order', async () => {
  const db = database();
  assert.equal(await loadCheckoutOrder(db.client, 'other-owner', { key }), null);
  assert.equal(await loadCheckoutOrder(db.client, 'other-owner', { externalReference: reference }), null);
  assert.equal(await loadCheckoutOrder(db.client, 'other-owner', { paymentId: 'pay_test' }), null);
  await assert.rejects(loadCheckoutOrder(db.client, '', { key }), /Authentication required/);
});

test('a payment-ID return is translated to signed reference credentials only for its owner', async () => {
  const db = database();
  const snapshot = await loadCheckoutOrder(db.client, 'owner-one', { paymentId: 'pay_test' });
  assert.equal(snapshot.credentials.externalReference, reference);
  assert.ok(verifyStatusToken(reference, snapshot.credentials.statusToken));
});

test('recovery takes the amount from the order rather than stale payment results', async () => {
  const db = database(); db.tables.orders[0].amount_cents = 12500;
  const snapshot = await loadCheckoutOrder(db.client, 'owner-one', { externalReference: reference });
  assert.equal(snapshot.payment.amount, 12500);
  assert.equal(snapshot.order.amount, 12500);
});

test('a reserved attempt without a finished charge stays recoverable and never creates a payment', async () => {
  const db = database(); db.tables.idempotency_keys[0].status = 'unknown'; db.tables.idempotency_keys[0].result = null; db.tables.orders = [];
  const snapshot = await loadCheckoutOrder(db.client, 'owner-one', { key });
  assert.equal(snapshot.status, 'unknown'); assert.equal(snapshot.payment, null); assert.equal(snapshot.order, null);
  assert.ok(db.calls.every(call => typeof call.columns === 'string'));
});
