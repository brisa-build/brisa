import PokemonCard from '@/components/pokemon-card';
import { pokemons } from '@/data';

export default function Homepage() {
  return (
    <>
      <div>
        <h1 className="text-5xl font-bold mb-4">Brisa - Poke</h1>
        <h3 className="text-xl text-gray-500 mb-8">
          An example using View Transitions with Brisa.
        </h3>
      </div>
      <div className="flex flex-wrap gap-4 py-8">
        {pokemons.map((pokemon) => (
          <PokemonCard pokemon={pokemon} />
        ))}
      </div>
    </>
  );
}
