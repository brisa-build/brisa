import fs from 'node:fs';
import path from 'node:path';
import type { RequestContext } from '@/types';
import { getConstants } from '@/constants';

type Result = {
  clientFile: string | null;
  pathPageI18n: string | null;
  filenameI18n: string | null;
  filename: string | null;
};

// TODO: This should be injected via brisa-project-internals
export default function getClientFilesFromRequest(request: RequestContext) {
  const { BUILD_DIR } = getConstants();
  const { locale } = request.i18n;
  const result: Result = {
    clientFile: null,
    pathPageI18n: null,
    filenameI18n: null,
    filename: null,
  };

  result.clientFile =
    request.route?.filePath
      ?.replace(path.sep + 'pages', path.sep + 'pages-client')
      ?.replace('.js', '.txt') ?? null;

  if (!result.clientFile || !fs.existsSync(result.clientFile!)) {
    return result;
  }

  const hash = fs.readFileSync(result.clientFile, 'utf8');

  result.filename = request.route.src.replace('.js', `-${hash}.js`);

  if (locale) {
    result.filenameI18n = result.filename.replace('.js', `-${locale}.js`);
    result.pathPageI18n = path.join(
      BUILD_DIR,
      'pages-client',
      result.filenameI18n,
    );
  }

  return result;
}
