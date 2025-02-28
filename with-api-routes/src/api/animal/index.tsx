import type { Animal } from '@/types';

const animals: Animal[] = [
  { id: '1', name: 'Dog' },
  { id: '2', name: 'Cat' },
  { id: '3', name: 'Bird' },
  { id: '4', name: 'Fish' },
  { id: '5', name: 'Horse' },
];

export function GET() {
  return new Response(JSON.stringify(animals), {
    headers: { 'content-type': 'application/json' },
  });
}
