import { RuleTester } from '@typescript-eslint/rule-tester';
import parser from '@typescript-eslint/parser'; // Import the parser object
import rule from '../index';

// Configure RuleTester to use Jest's globals
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.afterAll = afterAll;

const ruleTester = new RuleTester({
  languageOptions: {
    parser, // Pass the parser object directly
    ecmaVersion: 2020,
    sourceType: 'module',
  },
});

describe('no-server-event-prevent', () => {
  ruleTester.run(
    'no-server-event-prevent',
    rule.rules['no-server-event-prevent'],
    {
      valid: [
        {
          code: `event.preventDefault();`,
          filename: 'web-components/component.ts', // Allowed in web-components
        },
        {
          code: `event.stopPropagation();`,
          filename: 'web-components/component.ts', // Allowed in web-components
        },
      ],
      invalid: [
        {
          code: `event.preventDefault();`,
          filename: 'server-component.ts', // Not allowed outside web-components
          errors: [
            { messageId: 'preventUsage', data: { method: 'preventDefault' } },
          ],
        },
        {
          code: `event.stopPropagation();`,
          filename: 'server-component.ts', // Not allowed outside web-components
          errors: [
            { messageId: 'preventUsage', data: { method: 'stopPropagation' } },
          ],
        },
      ],
    },
  );
});
