import type { Pokemon } from '@/data';

export default function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <a href={`/pokemon/${pokemon.slug}`} class="block">
      <article class="group bg-flex flex-col sm:w-64 w-1/4 bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all">
        <div class="sm:w-64 w-1/4 overflow-hidden">
          <img
            src={pokemon.cover}
            alt={pokemon.name}
            class="object-cover object-center w-full grayscale-[0.1] group-hover:grayscale-0 h-full rounded-md group-hover:scale-105 transition-all"
          />
        </div>
        <div class="p-6">
          <h3 class="font-semibold truncate">{pokemon.name}</h3>
          <p class="text-gray-600 text-sm truncate">{pokemon.description}</p>
        </div>
      </article>
    </a>
  );
}
