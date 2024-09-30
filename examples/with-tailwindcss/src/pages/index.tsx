import PokemonCard from '@/components/pokemon-card';
import { pokemons } from '@/data';

export default function Homepage() {
  return (
    <>
      <div>
        <h1 class="text-5xl font-bold mb-4">Brisa - Poke</h1>
        <h2 class="text-xl text-gray-500 mb-8">
          An example using Tailwind CSS with Brisa.
        </h2>
        <p>
          Edit <code>src/pages/index.tsx</code>.
        </p>
      </div>
      <div class="flex flex-wrap gap-4 py-8">
        {pokemons.map((pokemon) => (
          <PokemonCard pokemon={pokemon} />
        ))}
      </div>
    </>
  );
}
