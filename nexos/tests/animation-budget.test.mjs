import test from 'node:test';
import assert from 'node:assert/strict';
import { createResolutionBudget, createMotionDetailBudget } from '../src/lib/animation-budget.ts';

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

test('detail adapts after sustained pressure and recovers after four healthy windows', () => {
  const budget = createMotionDetailBudget();
  assert.equal(budget.sample(90), 'full');
  let detail;
  for (let i = 0; i < 100; i++) detail = budget.sample(50);
  assert.equal(detail, 'light');
  for (let i = 0; i < 700; i++) detail = budget.sample(16);
  assert.equal(detail, 'full');
});

test('limited devices begin with light detail and suspension does not change it', () => {
  const budget = createMotionDetailBudget('light');
  assert.equal(budget.sample(0), 'light');
  assert.equal(budget.sample(5000), 'light');
  assert.equal(budget.sample(16), 'light');
});
