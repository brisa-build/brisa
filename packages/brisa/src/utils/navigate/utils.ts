const NAVIGATE_PREFIX = 'navigate:';

export function isNavigateThrowable(error: unknown) {
  return error instanceof Error && error.name.startsWith(NAVIGATE_PREFIX);
}

export function getNavigateMode(error: Error) {
  return error.name.replace(NAVIGATE_PREFIX, '');
}
