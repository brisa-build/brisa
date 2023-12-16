export default function createContext<T>(defaultValue: T) {
  return { id: Symbol("context"), defaultValue };
}
