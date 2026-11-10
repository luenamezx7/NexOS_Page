import assert from 'node:assert/strict';
import { test } from 'node:test';
import { recommendQuizSolution, QUIZ_SOLUTIONS } from '../src/lib/quiz-recommendation.ts';

test('recommends the main solution for clear patterns of answers', () => {
  assert.equal(recommendQuizSolution([2, 0, 3, 0, 1, 1, 2, 3]), 'plate');
  assert.equal(recommendQuizSolution([2, 0, 1, 0, 0, 0, 2, 1]), 'menu');
  assert.equal(recommendQuizSolution([2, 3, 0, 2, 2, 2, 1, 2]), 'site');
  assert.equal(recommendQuizSolution([0, 1, 3, 3, 2, 2, 0, 0]), 'landing');
  assert.equal(recommendQuizSolution([3, 2, 2, 0, 3, 3, 3, 2]), 'easychat');
});

test('the upcoming product cannot be presented as currently available', () => {
  assert.equal(QUIZ_SOLUTIONS.easychat.developing, true);
  assert.match(QUIZ_SOLUTIONS.easychat.reason, /em desenvolvimento/i);
});
