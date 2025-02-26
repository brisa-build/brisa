import { describe, it, expect } from 'bun:test';
import getContentTypeFromPath from '.';

const BATTERY_TESTS = [
  {
    input: 'test.html',
    output: 'text/html;charset=utf-8',
  },
  {
    input: 'test.css',
    output: 'text/css;charset=utf-8',
  },
  {
    input: 'test.js',
    output: 'application/javascript;charset=utf-8',
  },
  {
    input: 'test.json',
    output: 'application/json;charset=utf-8',
  },
  {
    input: 'test.png',
    output: 'image/png',
  },
  {
    input: 'test.jpg',
    output: 'image/jpeg',
  },
  {
    input: 'test.webp',
    output: 'image/webp',
  },
  {
    input: 'test.mp4',
    output: 'video/mp4',
  },
  {
    input: 'test.mp3',
    output: 'audio/mpeg',
  },
  {
    input: 'test.woff',
    output: 'font/woff',
  },
  {
    input: 'test.woff2',
    output: 'font/woff2',
  },
  {
    input: 'test.ttf',
    output: 'font/ttf',
  },
  {
    input: 'test.otf',
    output: 'font/otf',
  },
  {
    input: 'test.eot',
    output: 'application/vnd.ms-fontobject',
  },
  {
    input: 'test.svg',
    output: 'image/svg+xml',
  },
  {
    input: 'test.xml',
    output: 'application/xml',
  },
  {
    input: 'test.txt',
    output: 'text/plain;charset=utf-8',
  },
  {
    input: 'test',
    output: 'application/octet-stream',
  },
];

describe('utils/get-content-type-from-path', () => {
  for (const { input, output } of BATTERY_TESTS) {
    it(`should work with ${input}`, () => {
      expect(getContentTypeFromPath(input)).toBe(output);
    });
  }
});
