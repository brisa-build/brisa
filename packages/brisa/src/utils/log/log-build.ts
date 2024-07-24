import { getConstants } from '@/constants';
import type { RequestContext } from '@/types';
import { boldLog } from '@/utils/log/log-color';

const BRISA_ERRORS = '__BRISA_ERRORS__';

export function logTable(data: { [key: string]: string }[]) {
  const { LOG_PREFIX } = getConstants();
  const headers = Object.keys(data[0]);
  const maxLengths = headers.map((header) =>
    data.reduce((max, item) => Math.max(max, item[header].length), header.length),
  );
  const lines = [];

  // Headers
  lines.push(headers.map((header, i) => header.padEnd(maxLengths[i])).join(' | '));

  // Separators
  lines.push('-'.repeat(maxLengths.reduce((total, len) => total + len + 3, 0)));

  // Rows
  for (const item of data) {
    const cells = headers.map((header, i) => item[header].padEnd(maxLengths[i]));
    lines.push(cells.join(' | '));
  }

  console.log(LOG_PREFIX.INFO);
  lines.forEach((line) => console.log(LOG_PREFIX.INFO, line));
}

function log(type: 'Error' | 'Warning') {
  const { LOG_PREFIX } = getConstants();
  const LOG =
    LOG_PREFIX[
      {
        Error: 'ERROR',
        Warning: 'WARN',
      }[type] as keyof typeof LOG_PREFIX
    ];

  return (messages: string[], footer?: string, stack?: string) => {
    console.log(LOG, `Ops! ${type}:`);
    console.log(LOG, '--------------------------');
    messages.forEach((message, index) =>
      console.log(LOG, index === 0 ? boldLog(message) : message),
    );
    console.log(LOG, '--------------------------');
    if (footer) console.log(LOG, footer);
    if (stack) console.log(LOG, stack);
  };
}

export function logError({
  messages,
  req,
  stack,
  docTitle,
  docLink,
}: {
  messages: string[];
  req?: RequestContext;
  stack?: string;
  docTitle?: string;
  docLink?: string;
}) {
  let footer;

  if (req) {
    const error = {
      title: messages[0],
      details: messages.slice(1),
      stack,
      docTitle,
      docLink,
    };

    const errors = req.store.get(BRISA_ERRORS) || [];
    errors.push(error);
    req.store.set(BRISA_ERRORS, errors);
    req.store.transferToClient([BRISA_ERRORS]);
  }

  if (docLink) {
    footer = `${docTitle ?? 'Documentation'}: ${docLink}`;
  }

  return log('Error')(messages, footer, stack);
}

export function logWarning(messages: string[], footer?: string) {
  return log('Warning')(messages, footer);
}

export function logBuildError(title: string, logs: (BuildMessage | ResolveMessage)[]) {
  const messages = [
    title,
    '',
    ...logs.flatMap((l) => {
      const position = l.position
        ? `${boldLog('position')}: ${JSON.stringify(l.position, undefined, 2)}`
        : '';
      return [
        `${boldLog('level')}: ${l.level}`,
        `${boldLog('message')}: ${l.message}`,
        `${boldLog('name')}: ${l.name}`,
        ...position.split('\n'),
      ];
    }),
  ];

  const isJSXRuntimeError = messages.some((m) => m.includes('react/jsx'));
  const isMDXError = messages.some((m) => m.includes('mdx'));

  if (isJSXRuntimeError) {
    messages.push('');
    messages.push('The error above is usually caused by the following:');
    messages.push(
      "Verify inside tsconfig.json the 'jsx' option set to 'react-jsx' and the 'jsxImportSource' option set to 'brisa'",
    );
  }

  if (isMDXError) {
    messages.push('');
    messages.push('The error above is usually caused by the following:');
    messages.push('Verify if the MDX plugin is correctly integrated in the brisa.config file');
    messages.push('Integrate MDX with the following command:');
    messages.push('');
    messages.push(`> bunx brisa add mdx`);
  }

  messages.push('');

  logError({
    messages,
    docTitle: "Please, if you can't solve the problem, open an issue on GitHub",
    docLink: 'https://github.com/brisa-build/brisa/issues/new',
  });
}
