const JSX_REGEX = new RegExp(/^(jsx|jsxDEV|jsxs|_jsx|_jsxs)(_?[a-z0-9]+)?$/);

export default function isJSXIdentifier(identifier: string) {
  return JSX_REGEX.test(identifier);
}
