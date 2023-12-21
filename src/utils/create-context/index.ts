type Id = string | symbol;

export default function createContext<T>(
  defaultValue: T,
  id: Id = Symbol("context"),
) {
  return { id, defaultValue };
}
