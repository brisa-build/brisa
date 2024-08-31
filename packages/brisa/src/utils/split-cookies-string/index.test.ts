import { describe, it, expect } from 'bun:test';
import splitCookiesString from '.';

const array: string[] = ['a', 'b'];

const cookieNoParams = 'sessionid=6ky4pkr7qoi4me7rwleyvxjove25huef';
const cookieWithParams = `${cookieNoParams}; HttpOnly; Path=/`;
const cookieWithExpires =
  'cid=70125eaa-399a-41b2-b235-8a5092042dba; expires=Thu, 04-Jun-2020 12:17:56 GMT; Max-Age=63072000; Path=/; HttpOnly; Secure';
const cookieWithExpiresAtEnd =
  'client_id=70125eaa-399a-41b2-b235-8a5092042dba; Max-Age=63072000; Path=/; expires=Thu, 04-Jun-2020 12:17:56 GMT';
const jsonCookie = `myJsonCookie=${JSON.stringify({
  foo: 'bar',
  arr: [1, 2, 3],
})}`;
const jsonCookieWithParams = `${jsonCookie}; expires=Thu, 04-Jun-2020 12:17:56 GMT; Max-Age=63072000; Path=/; HttpOnly; Secure`;

const firstWithParamSecondNoParam = `${cookieWithParams}, ${cookieNoParams}`;
const threeNoParams = `${cookieNoParams}, ${cookieNoParams}, ${cookieNoParams}`;
const threeWithParams = `${cookieWithParams}, ${cookieWithParams}, ${cookieWithParams}`;
const firstWithExpiresSecondNoParam = `${cookieWithExpires}, ${cookieNoParams}`;
const firstWithExpiresSecondWithParam = `${cookieWithExpires}, ${cookieWithParams}`;
const firstWithExpiresAtEndSecondNoParam = `${cookieWithExpiresAtEnd}, ${cookieNoParams}`;
const firstWithExpiresAtEndSecondWithParam = `${cookieWithExpiresAtEnd}, ${cookieWithParams}`;
const firstWithExpiresSecondWithExpires = `${cookieWithExpires}, ${cookieWithExpires}`;
const firstWithExpiresSecondWithExpiresAtEnd = `${cookieWithExpires}, ${cookieWithExpiresAtEnd}`;
const firstWithExpiresAtEndSecondWithExpires = `${cookieWithExpiresAtEnd}, ${cookieWithExpires}`;
const firstWithExpiresAtEndSecondWithExpiresAtEnd = `${cookieWithExpiresAtEnd}, ${cookieWithExpiresAtEnd}`;
const firstWithExpiresSecondWithExpiresAtEndThirdWithExpires = `${cookieWithExpires}, ${cookieWithExpiresAtEnd}, ${cookieWithExpires}`;
const firstWithExpiresSecondWithExpiresAtEndThirdWithExpiresAtEnd = `${cookieWithExpires}, ${cookieWithExpiresAtEnd}, ${cookieWithExpiresAtEnd}`;
const threeWithExpires = `${cookieWithExpires}, ${cookieWithExpires}, ${cookieWithExpires}`;
const threeWithExpiresAtEnd = `${cookieWithExpiresAtEnd}, ${cookieWithExpiresAtEnd}, ${cookieWithExpiresAtEnd}`;

describe('splitCookiesString', () => {
  it('should return array if Array', () => {
    const actual = splitCookiesString(array);
    const expected = array;
    expect(actual).toEqual(expected);
  });

  it('should return empty array on non string type', () => {
    const actual = splitCookiesString(1 as any);
    const expected: string[] = [];
    expect(actual).toEqual(expected);
  });

  it('should parse empty string', () => {
    const actual = splitCookiesString('');
    const expected: string[] = [];
    expect(actual).toEqual(expected);
  });

  it('should parse single cookie without params', () => {
    const actual = splitCookiesString(cookieNoParams);
    const expected = [cookieNoParams];
    expect(actual).toEqual(expected);
  });

  it('should parse single cookie with params', () => {
    const actual = splitCookiesString(cookieWithParams);
    const expected = [cookieWithParams];
    expect(actual).toEqual(expected);
  });

  it('should parse three cookies without params', () => {
    const actual = splitCookiesString(threeNoParams);
    const expected = [cookieNoParams, cookieNoParams, cookieNoParams];
    expect(actual).toEqual(expected);
  });

  it('should parse three with params', () => {
    const actual = splitCookiesString(threeWithParams);
    const expected = [cookieWithParams, cookieWithParams, cookieWithParams];
    expect(actual).toEqual(expected);
  });

  it('should parse first with params, second without params', () => {
    const actual = splitCookiesString(firstWithParamSecondNoParam);
    const expected = [cookieWithParams, cookieNoParams];
    expect(actual).toEqual(expected);
  });

  it('should parse single with expires', () => {
    const actual = splitCookiesString(cookieWithExpires);
    const expected = [cookieWithExpires];
    expect(actual).toEqual(expected);
  });

  it('should parse single with expires at end', () => {
    const actual = splitCookiesString(cookieWithExpiresAtEnd);
    const expected = [cookieWithExpiresAtEnd];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires, second without params', () => {
    const actual = splitCookiesString(firstWithExpiresSecondNoParam);
    const expected = [cookieWithExpires, cookieNoParams];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires, second with params', () => {
    const actual = splitCookiesString(firstWithExpiresSecondWithParam);
    const expected = [cookieWithExpires, cookieWithParams];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires at end, second without params', () => {
    const actual = splitCookiesString(firstWithExpiresAtEndSecondNoParam);
    const expected = [cookieWithExpiresAtEnd, cookieNoParams];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires at end, second with params', () => {
    const actual = splitCookiesString(firstWithExpiresAtEndSecondWithParam);
    const expected = [cookieWithExpiresAtEnd, cookieWithParams];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires, second with expires', () => {
    const actual = splitCookiesString(firstWithExpiresSecondWithExpires);
    const expected = [cookieWithExpires, cookieWithExpires];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires, second with expires at end', () => {
    const actual = splitCookiesString(firstWithExpiresSecondWithExpiresAtEnd);
    const expected = [cookieWithExpires, cookieWithExpiresAtEnd];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires at end, second with expires', () => {
    const actual = splitCookiesString(firstWithExpiresAtEndSecondWithExpires);
    const expected = [cookieWithExpiresAtEnd, cookieWithExpires];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires at end, second with expires at end', () => {
    const actual = splitCookiesString(
      firstWithExpiresAtEndSecondWithExpiresAtEnd,
    );
    const expected = [cookieWithExpiresAtEnd, cookieWithExpiresAtEnd];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires, second with expires at end, third with expires', () => {
    const actual = splitCookiesString(
      firstWithExpiresSecondWithExpiresAtEndThirdWithExpires,
    );
    const expected = [
      cookieWithExpires,
      cookieWithExpiresAtEnd,
      cookieWithExpires,
    ];
    expect(actual).toEqual(expected);
  });

  it('should parse first with expires, second with expires at end, third with expires at end', () => {
    const actual = splitCookiesString(
      firstWithExpiresSecondWithExpiresAtEndThirdWithExpiresAtEnd,
    );
    const expected = [
      cookieWithExpires,
      cookieWithExpiresAtEnd,
      cookieWithExpiresAtEnd,
    ];
    expect(actual).toEqual(expected);
  });

  it('should parse three with expires', () => {
    const actual = splitCookiesString(threeWithExpires);
    const expected = [cookieWithExpires, cookieWithExpires, cookieWithExpires];
    expect(actual).toEqual(expected);
  });

  it('should parse three with expires at end', () => {
    const actual = splitCookiesString(threeWithExpiresAtEnd);
    const expected = [
      cookieWithExpiresAtEnd,
      cookieWithExpiresAtEnd,
      cookieWithExpiresAtEnd,
    ];
    expect(actual).toEqual(expected);
  });

  it('should not split json', () => {
    const actual = splitCookiesString(jsonCookie);
    const expected = [jsonCookie];
    expect(actual).toEqual(expected);
  });

  it('should not split json with params', () => {
    const actual = splitCookiesString(jsonCookieWithParams);
    const expected = [jsonCookieWithParams];
    expect(actual).toEqual(expected);
  });
});
