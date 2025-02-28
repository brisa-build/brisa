import { RuleTester } from '@typescript-eslint/rule-tester';
import parser from '@typescript-eslint/parser'; // Import the parser object

export const ruleTester = new RuleTester({
  languageOptions: {
    parser, // Pass the parser object directly
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});
