import test from 'node:test';
import assert from 'node:assert/strict';
import { createResolutionBudget } from '../src/lib/animation-budget.ts';

test('sustained slow frames reduce pixel cost without a zero-resolution state', () => {
  const budget = createResolutionBudget();
  let scale;
  for (let i = 0; i < 300; i++) scale = budget.sample(65);
  assert.equal(scale, .5);
});
test('isolated stalls do not lower quality and healthy windows restore it gradually', () => {
  const budget = createResolutionBudget();
  assert.equal(budget.sample(240), .85);
  for (let i = 0; i < 40; i++) budget.sample(60);
  let scale;
  for (let i = 0; i < 300; i++) scale = budget.sample(1000 / 30);
  assert.ok(scale > .7 && scale <= 1);
});
test('suspension gaps are not classified as rendering pressure', () => {
  const budget = createResolutionBudget();
  assert.equal(budget.sample(5000), .85);
  assert.equal(budget.sample(0), .85);
});
