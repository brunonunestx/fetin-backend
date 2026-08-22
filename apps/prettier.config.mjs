/** @type {import('prettier').Config} */
const config = {
  endOfLine: 'auto',
  printWidth: 100,
  plugins: ['prettier-plugin-tailwindcss'],
  semi: true,
  singleQuote: true,
  tailwindStylesheet: './web/src/index.css',
  trailingComma: 'all',
};

export default config;
