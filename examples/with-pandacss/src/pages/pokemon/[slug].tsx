import Attacks from '@/components/attacks';
import PokemonCard from '@/components/pokemon-card';
import { pokemons, type Pokemon } from '@/data';
import { dangerHTML, type RequestContext } from 'brisa';
import { base, header, image } from '@/styles/styles';
import { css } from '../../../styled-system/css';

export default function PokemonPage({}, { route }: RequestContext) {
  const slug = route.params!.slug;
  const pokemon = pokemons.find((p) => p.slug === slug) ?? ({} as Pokemon);

  return (
    <div className={base}>
      <div className={header}>
        <a className={''} href="/">
          Poke
        </a>
        <span className={css({ margin: 3 })}>{pokemon.category}</span>
        <span>{pokemon.name}</span>
      </div>
      <div className={base}>
        <div className={image}>
          <img src={pokemon.cover} alt={pokemon.name} className="" />
        </div>
        <article className={base}>
          <div className={css({ width: '3/5', margin: '4' })}>
            <h1 className="">{pokemon.name}</h1>
            <p className="">{pokemon.description}</p>
          </div>
          <p>
            <Attacks attacks={pokemon.attacks} />
          </p>
        </article>
      </div>
      <div className=""></div>
      <h4 className="">More pokemons</h4>
      <div className="">
        {pokemons
          .filter((p) => p.id !== pokemon.id)
          .map((pr) => (
            <PokemonCard pokemon={pr} />
          ))}
      </div>
      <script>
        {dangerHTML(`
        document.addEventListener("click", (event) => {
          if (location.pathname === "/") return;
          if (event?.target?.tagName === "A") {
            document.querySelector(".animate-in")?.classList.add("opacity-0");
          }
        });
      `)}
      </script>
    </div>
  );
}
