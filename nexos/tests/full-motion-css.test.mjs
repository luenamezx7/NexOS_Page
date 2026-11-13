import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import fullMotion from '../scripts/postcss-full-motion.cjs';

test('full-motion compilation preserves responsive and forced-color behavior while removing motion suppression', async () => {
  const result = await postcss([fullMotion()]).process(`
    @media (max-width: 767px) { .card { width: 100%; } }
    @media (prefers-reduced-motion: reduce) { .card { animation: none !important; } }
    @media (min-width: 768px) and (prefers-reduced-motion: no-preference) { .card { animation: drift 4s infinite; } }
    @media (forced-colors: active) { .card { color: CanvasText; } }
    @media (max-width: 500px) { @media(prefers-reduced-motion:reduce) { .card { transform: none; } } }
  `, { from: undefined });
  const root = postcss.parse(result.css);
  const media = [];
  root.walkAtRules('media', rule => media.push(rule.params));
  assert.ok(media.includes('(max-width: 767px)'));
  assert.ok(media.includes('(forced-colors: active)'));
  assert.ok(media.includes('(min-width: 768px) and (min-width: 0px)'));
  assert.doesNotMatch(result.css, /prefers-reduced-motion|animation: none|transform: none/);
  assert.match(result.css, /animation: drift 4s infinite/);
});
