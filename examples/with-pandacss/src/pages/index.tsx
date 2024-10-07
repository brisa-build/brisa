import PokemonCard from "@/components/pokemon-card";
import { pokemons } from "@/data";
import { css } from "../../styled-system/css";
import { base, header } from "@/styles/styles";

export default function Homepage() {
  return (
    <>
      <div class={base}>
        <h1 class={header}>Brisa - Poke</h1>
        <h2 class={css({ height: "10", margin: "10" })}>
          An example using Panda CSS with Brisa.
        </h2>
        <div class="">
          {pokemons.map((pokemon) => (
            <PokemonCard pokemon={pokemon} />
          ))}
        </div>
      </div>
    </>
  );
}
