import { it, describe, expect } from 'bun:test';
import escapeHTML from '.';

// Note: some tests are based on the Bun.escapeHTML tests:
// https://github.com/oven-sh/bun/blob/460d6edbdac3820caf87fe38add538b7b6487aa8/test/js/bun/util/escapeHTML.test.js
const BATTERY_OF_TESTS: [
  string | object | number | boolean | null | undefined,
  string,
][] = [
  // Basic escape cases
  [
    '<script>alert("hi")</script>',
    '&lt;script&gt;alert(&quot;hi&quot;)&lt;/script&gt;',
  ],
  ['&', '&amp;'],
  ['"', '&quot;'],
  ["'", '&#x27;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  [123, '123'],
  [true, 'true'],
  [false, 'false'],
  [{}, '[object Object]'],
  [null, 'null'],
  [undefined, 'undefined'],
  [NaN, 'NaN'],
  [Infinity, 'Infinity'],
  [0.1, '0.1'],
  [
    `<a href="https://example.com">`,
    '&lt;a href=&quot;https://example.com&quot;&gt;',
  ],

  // Additional cases based on the Bun.escapeHTML tests
  ['absolutely nothing to do here', 'absolutely nothing to do here'],
  ['<script>alert(1)</script>', '&lt;script&gt;alert(1)&lt;/script&gt;'],
  ['\n', '\n'],
  ['\r', '\r'],
  ['\t', '\t'],
  ['\f', '\f'],
  ['\v', '\v'],
  ['\b', '\b'],
  ['\u00A0', '\u00A0'],
  [
    'lalala<script>alert(1)</script>lalala',
    'lalala&lt;script&gt;alert(1)&lt;/script&gt;lalala',
  ],
  ['What does 😊 mean?', 'What does 😊 mean?'],
  ['<What does 😊', '&lt;What does 😊'],
  ['<div>What does 😊 mean in text?', '&lt;div&gt;What does 😊 mean in text?'],
  [
    ('lalala' + '<script>alert(1)</script>' + 'lalala').repeat(900),
    'lalala&lt;script&gt;alert(1)&lt;/script&gt;lalala'.repeat(900),
  ],
  [
    ('<script>alert(1)</script>' + 'lalala').repeat(900),
    '&lt;script&gt;alert(1)&lt;/script&gt;lalala'.repeat(900),
  ],
  [
    ('lalala' + '<script>alert(1)</script>').repeat(900),
    ('lalala' + '&lt;script&gt;alert(1)&lt;/script&gt;').repeat(900),
  ],
  [
    '😊lalala<script>alert(1)</script>lalala',
    '😊lalala&lt;script&gt;alert(1)&lt;/script&gt;lalala',
  ],
  [
    '<script>😊alert(1)</script>lalala',
    '&lt;script&gt;😊alert(1)&lt;/script&gt;lalala',
  ],
  [
    '<script>alert(1)😊</script>lalala',
    '&lt;script&gt;alert(1)😊&lt;/script&gt;lalala',
  ],
  [
    '<script>alert(1)</script>😊lalala',
    '&lt;script&gt;alert(1)&lt;/script&gt;😊lalala',
  ],
  [
    '<script>alert(1)</script>lal😊ala',
    '&lt;script&gt;alert(1)&lt;/script&gt;lal😊ala',
  ],
  [
    '<script>alert(1)</script>' + 'lal😊ala'.repeat(10),
    '&lt;script&gt;alert(1)&lt;/script&gt;' + 'lal😊ala'.repeat(10),
  ],
  [
    'la😊<script>alert(1)</script>',
    'la😊&lt;script&gt;alert(1)&lt;/script&gt;',
  ],
  [
    ('lalala' + '<script>alert(1)</script>😊').repeat(1),
    ('lalala' + '&lt;script&gt;alert(1)&lt;/script&gt;😊').repeat(1),
  ],
  ['😊'.repeat(100), '😊'.repeat(100)],
  ['😊<'.repeat(100), '😊&lt;'.repeat(100)],
  ['<😊>'.repeat(100), '&lt;😊&gt;'.repeat(100)],
  ['😊', '😊'],
  ['😊😊', '😊😊'],
  ['😊lo', '😊lo'],
  ['lo😊', 'lo😊'],
  [' '.repeat(32) + '😊', ' '.repeat(32) + '😊'],
  [' '.repeat(32) + '😊😊', ' '.repeat(32) + '😊😊'],
  [' '.repeat(32) + '😊lo', ' '.repeat(32) + '😊lo'],
  [' '.repeat(32) + 'lo😊', ' '.repeat(32) + 'lo😊'],
];

describe('utils', () => {
  describe('escapeHTML', () => {
    it.each(BATTERY_OF_TESTS)(
      `should escape %#/${BATTERY_OF_TESTS.length} as we expect`,
      (input, expected) => {
        expect(escapeHTML(input)).toBe(expected);
      },
    );

    it.each(BATTERY_OF_TESTS)(
      `should escape %#/${BATTERY_OF_TESTS.length} in the same way than Bun.escapeHTML`,
      (input) => {
        expect(escapeHTML(input)).toBe(Bun.escapeHTML(input as any));
      },
    );
  });
});
