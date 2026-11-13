import test from 'node:test';
import assert from 'node:assert/strict';
import { profilePatchSchema } from '../src/lib/account/profile-validation.ts';

test('profile rejects oversized fields, empty patches and ownership changes', () => {
  for (const input of [{}, { fullName: 'x'.repeat(101) }, { phone: '1'.repeat(26) }, { fullName: ' ' }, { phone: '<script>' }, { fullName: 'Ana', id: 'other-user' }]) {
    assert.equal(profilePatchSchema.safeParse(input).success, false);
  }
});
test('profile trims names and accepts a formatted phone or removal', () => {
  assert.deepEqual(profilePatchSchema.parse({ fullName: ' Ana ', phone: '+55 (11) 99999-9999' }), { fullName: 'Ana', phone: '+55 (11) 99999-9999' });
  assert.deepEqual(profilePatchSchema.parse({ phone: '' }), { phone: '' });
});
