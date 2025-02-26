import type { BrisaContext } from '@/types';

export default function createContext<T>(defaultValue: T, id?: string) {
  return { id, defaultValue } as BrisaContext<T>;
}
