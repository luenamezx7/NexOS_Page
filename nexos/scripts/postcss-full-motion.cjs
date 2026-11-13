/** Product policy: ship the full authored motion, including imported component CSS. */
module.exports = () => ({
  postcssPlugin: 'nexos-full-motion',
  OnceExit(root) {
    root.walkAtRules('media', rule => {
      if (/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(rule.params)) {
        rule.remove();
      } else {
        rule.params = rule.params.replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, '(min-width: 0px)');
      }
    });
  },
});
module.exports.postcss = true;
