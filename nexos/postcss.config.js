module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    [require.resolve('./scripts/postcss-full-motion.cjs')]: {},
    autoprefixer: {},
  },
};