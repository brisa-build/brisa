export function isRerenderThrowable(error: Error) {
  return error.name === 'rerender';
}
