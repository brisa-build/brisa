export function isRerenderThrowable(error: unknown) {
  return (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === 'rerender'
  );
}
