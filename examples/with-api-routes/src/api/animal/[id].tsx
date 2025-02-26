import type { AnimalInfo } from '@/types';
import type { RequestContext } from 'brisa';

const animals: AnimalInfo[] = [
  {
    id: '1',
    name: 'Dog',
    hasTail: true,
    abilities: ['bark', 'run'],
    image: '/images/dog.avif',
  },
  {
    id: '2',
    name: 'Cat',
    hasTail: true,
    abilities: ['meow', 'climb'],
    image: '/images/cat.avif',
  },
  {
    id: '3',
    name: 'Bird',
    hasTail: false,
    abilities: ['fly', 'sing'],
    image: '/images/bird.avif',
  },
  {
    id: '4',
    name: 'Fish',
    hasTail: true,
    abilities: ['swim'],
    image: '/images/fish.avif',
  },
  {
    id: '5',
    name: 'Horse',
    hasTail: true,
    abilities: ['run'],
    image: '/images/horse.avif',
  },
];

const animalsByIndex = animals.reduce(
  (acc, animal) => {
    acc[animal.id] = animal;
    return acc;
  },
  {} as Record<string, AnimalInfo>,
);

export function GET(request: RequestContext) {
  const id = request.route.params!.id as string;

  return new Response(JSON.stringify(animalsByIndex[id]), {
    headers: { 'content-type': 'application/json' },
  });
}
