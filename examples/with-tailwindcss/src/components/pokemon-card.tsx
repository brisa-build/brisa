import type { Pokemon } from '@/data';

export default function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <a href={`/pokemon/${pokemon.slug}`} className="block">
      <article className="group bg-flex flex-col sm:w-64 w-1/4 bg-white shadow-sm rounded-lg overflow-hidden hover:shadow-xl hover:shadow-gray-100 transition-all">
        <div className="sm:w-64 w-1/4 overflow-hidden">
          <img
            src={pokemon.cover}
            alt={pokemon.name}
            className="object-cover object-center w-full grayscale-[0.1] group-hover:grayscale-0 h-full rounded-md group-hover:scale-105 transition-all"
          />
        </div>
        <div className="p-6">
          <h3 className="font-semibold truncate">{pokemon.name}</h3>
          <p className="text-gray-600 text-sm truncate">{pokemon.description}</p>
        </div>
      </article>
    </a>
  );
}
