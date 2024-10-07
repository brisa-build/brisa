import type { Pokemon } from '@/data';
import { css } from '../../styled-system/css';
import { baseCard, image } from '@/styles/styles';

export default function PokemonCard({ pokemon }: { pokemon: Pokemon }) {
  return (
    <a href={`/pokemon/${pokemon.slug}`} class="block">
      <article class={baseCard}>
        <div class={image}>
          <img src={pokemon.cover} alt={pokemon.name} class="" />
        </div>
        <div class={content}>
          <h3 class={css({})}>{pokemon.name}</h3>
          <p class="">{pokemon.description}</p>
        </div>
      </article>
    </a>
  );
}
