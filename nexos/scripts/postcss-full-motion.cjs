/** Apply the site's explicit full-motion policy while retaining responsive/contrast rules. */
module.exports = () => ({
  postcssPlugin: 'nexos-full-motion',
  OnceExit(root, { list }) {
    root.walkAtRules('media', rule => {
      if (!/prefers-reduced-motion/.test(rule.params)) return;
      const alternatives = list.comma(rule.params).flatMap(query => {
        if (/\(\s*prefers-reduced-motion\s*:\s*reduce\s*\)/.test(query)) return [];
        return [query
          .replace(/\s+and\s+\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, '')
          .replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)\s+and\s+/g, '')
          .replace(/\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, 'all')];
      });
      if (!alternatives.length) rule.remove();
      else if (alternatives.includes('all')) rule.replaceWith(...rule.nodes);
      else rule.params = alternatives.join(', ');
    });
  },
});
module.exports.postcss = true;
