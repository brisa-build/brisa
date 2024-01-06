export default function notFound() {
  throw new NotFoundError("Not found");
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function isNotFoundError(error: Error) {
  return error.name === "NotFoundError";
}
