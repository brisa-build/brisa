import type { Pokemon } from '@/data';
import { css } from '../../styled-system/css';
import { baseCard, content, image } from '@/styles/styles';

export default function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <a href={`/pokemon/${pokemon.slug}`} className="block">
      <article className={baseCard}>
        <div className={image}>
          <img src={pokemon.cover} alt={pokemon.name} className="" />
        </div>
        <div className={content}>
          <h3 className={css({})}>{pokemon.name}</h3>
          <p className="">{pokemon.description}</p>
        </div>
      </article>
    </a>
  );
}
