const NAVIGATE_PREFIX = 'navigate:';

export function isNavigateThrowable(error: unknown) {
  return (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    typeof error.name === 'string' &&
    error.name.startsWith(NAVIGATE_PREFIX)
  );
}

export function getNavigateMode(error: Error) {
  return error.name.replace(NAVIGATE_PREFIX, '');
}
