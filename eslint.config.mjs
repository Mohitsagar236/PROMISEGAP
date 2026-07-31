export default [
  {
    ignores: ["node_modules/**", ".next/**", "coverage/**", "playwright-report/**", "test-results/**", "prisma/dev.db"]
  },
  {
    files: ["*.config.mjs", "*.config.ts", "next.config.ts"],
    rules: {}
  }
];
