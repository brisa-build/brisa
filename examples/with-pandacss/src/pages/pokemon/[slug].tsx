import Attacks from "@/components/attacks";
import PokemonCard from "@/components/pokemon-card";
import { pokemons, type Pokemon } from "@/data";
import { dangerHTML, type RequestContext } from "brisa";
import { base, header, image } from "@/styles/styles";
import { css } from "../../../styled-system/css";

export default function PokemonPage({}, { route }: RequestContext) {
  const slug = route.params!.slug;
  const pokemon = pokemons.find((p) => p.slug === slug) ?? ({} as Pokemon);

  return (
    <div class={base}>
      <div class={header}>
        <a class={""} href="/">
          Poke
        </a>
        <span class={css({ margin: 3 })}>{pokemon.category}</span>
        <span>{pokemon.name}</span>
      </div>
      <div class={base}>
        <div class={image}>
          <img src={pokemon.cover} alt={pokemon.name} class="" />
        </div>
        <article class={base}>
          <div class={css({ width: "3/5", margin: "4" })}>
            <h1 class="">{pokemon.name}</h1>
            <p class="">{pokemon.description}</p>
          </div>
          <p>
            <Attacks attacks={pokemon.attacks} />
          </p>
        </article>
      </div>
      <div class=""></div>
      <h4 class="">More pokemons</h4>
      <div class="">
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
