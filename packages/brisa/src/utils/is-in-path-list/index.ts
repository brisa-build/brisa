import fs from 'node:fs';
import { getConstants } from '@/constants';
import type { RequestContext } from '@/types';

const SEPS_REGEX = /(\\|\/)+/g;
const TEMP_SEP = '|';

export default async function isInPathList(
  pathname: string,
  request: RequestContext,
) {
  const { BUILD_DIR } = getConstants();
  const listText = fs.existsSync(pathname)
    ? fs.readFileSync(pathname, 'utf-8')
    : '';

  if (!listText) return false;

  const route = (request.route?.filePath ?? '')
    .replace(BUILD_DIR, '')
    .replace(SEPS_REGEX, TEMP_SEP);
  const list = listText.split('\n');

  for (let i = 0; i < list.length; i += 1) {
    if (list[i].replace(SEPS_REGEX, TEMP_SEP) === route) return true;
  }

  return false;
}
