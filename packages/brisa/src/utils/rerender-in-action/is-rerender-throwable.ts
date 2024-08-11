export function isRerenderThrowable(error: unknown) {
  return error instanceof Error && error.name === 'rerender';
}
