// Skip PostCSS in test environment to avoid Vite/Vitest conflicts
const config = process.env.NODE_ENV === 'test'
  ? { plugins: [] }
  : { plugins: ["@tailwindcss/postcss"] };

export default config;
