module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
    [require.resolve('./scripts/postcss-full-motion.cjs')]: {},
  },
};