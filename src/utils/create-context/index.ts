import type { BrisaContext } from "brisa/jsx-runtime";

export default function createContext<T>(defaultValue: T, id?: string) {
  return { id, defaultValue } as BrisaContext<T>;
}
