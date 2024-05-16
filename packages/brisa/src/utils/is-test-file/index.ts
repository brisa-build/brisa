// Test file conventions: https://bun.sh/guides/test/run-tests
const testConventions = "(?:\\.test|_test|\\.spec|_spec)";
const REGEX_WITHOUT_FORMAT = new RegExp(`${testConventions}$`);
const REGEX_WITH_FORMAT = new RegExp(
  `${testConventions}\\.(js|jsx|ts|tsx|cjs|mjs)$`,
);

export default function isTestFile(file?: string, hasFormat = false): boolean {
  if (!file) return false;
  const regex = hasFormat ? REGEX_WITH_FORMAT : REGEX_WITHOUT_FORMAT;
  return regex.test(file);
}
