import { sep } from 'node:path';

export function normalizePath(rawPathname: string, separator = sep) {
  const pathname =
    rawPathname[0] === '{' ? JSON.parse(rawPathname).client : rawPathname;

  return pathname.replaceAll(separator, '/');
}
