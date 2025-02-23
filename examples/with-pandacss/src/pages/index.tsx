import PokemonCard from '@/components/pokemon-card';
import { pokemons } from '@/data';
import { css } from '../../styled-system/css';
import { base, header } from '@/styles/styles';

export default function Homepage() {
  return (
    <>
      <div className={base}>
        <h1 className={header}>Brisa - Poke</h1>
        <h2 className={css({ height: '10', margin: '10' })}>
          An example using Panda CSS with Brisa.
        </h2>
        <div className="">
          {pokemons.map((pokemon) => (
            <PokemonCard pokemon={pokemon} />
          ))}
        </div>
      </div>
    </>
  );
}
