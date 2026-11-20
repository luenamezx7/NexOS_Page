import test from 'node:test';
import assert from 'node:assert/strict';
import postcss from 'postcss';
import config from '../postcss.config.js';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

test('configured CSS pipeline keeps motion enabled and preserves responsive rules and forced colors', async () => {
  const plugins = Object.entries(config.plugins).map(([name, options]) => require(name)(options));
  const result = await postcss(plugins).process(`
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
  assert.ok(media.every(query => !query.includes('prefers-reduced-motion')));
  assert.ok(media.includes('(min-width: 768px)'));
  assert.doesNotMatch(result.css, /animation: none/);
  assert.doesNotMatch(result.css, /transform: none/);
  assert.match(result.css, /animation: drift 4s infinite/);
});

test('transitions.dev keeps its reduced-motion guard', async () => {
  const plugin = require('../scripts/postcss-full-motion.cjs');
  const result = await postcss([plugin()]).process(
    '@media (prefers-reduced-motion: reduce) { .t-input { animation: none !important; } }',
    { from: new URL('../src/styles/transitions.css', import.meta.url).pathname },
  );
  assert.match(result.css, /prefers-reduced-motion: reduce/);
  assert.match(result.css, /animation: none !important/);
});
