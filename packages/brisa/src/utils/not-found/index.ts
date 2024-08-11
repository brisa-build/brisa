const NOT_FOUND_ERROR_NAME = 'NotFoundError';

export default function notFound() {
  throw new NotFoundError('Not found');
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = NOT_FOUND_ERROR_NAME;
  }
}

export function isNotFoundError(error: unknown) {
  return (
    error &&
    typeof error === 'object' &&
    'name' in error &&
    error.name === NOT_FOUND_ERROR_NAME
  );
}
