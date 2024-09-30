import Attacks from '@/components/attacks';
import PokemonCard from '@/components/pokemon-card';
import { pokemons, type Pokemon } from '@/data';
import { dangerHTML, type RequestContext } from 'brisa';

export default function PokemonPage({}, { route }: RequestContext) {
  const slug = route.params!.slug;
  const pokemon = pokemons.find((p) => p.slug === slug) ?? ({} as Pokemon);

  return (
    <div class="max-w-4xl mx-auto relative">
      <div class="flex gap-2 pb-10 items-center text-gray-500">
        <a class="after:content-['/'] after:pl-2 capitalize" href="/">
          Poke
        </a>
        <span class="after:content-['/'] after:pl-2 capitalize">
          {pokemon.category}
        </span>
        <span>{pokemon.name}</span>
      </div>
      <div class="flex flex-col md:flex-row sm sm:gap-8">
        <div class="max-w-[450px] w-full h-full max-h-[450px]">
          <img
            src={pokemon.cover}
            alt={pokemon.name}
            class="w-full h-full object-cover rounded-xl shadow-2xl shadow-gray-200 border-b"
          />
        </div>
        <article class="py-4 flex justify-between flex-col">
          <div>
            <h1 class="text-3xl sm:text-5xl font-bold animate-in">
              {pokemon.name}
            </h1>
            <p class="max-w-sm py-4 text-lg">{pokemon.description}</p>
          </div>
          <p>
            <Attacks attacks={pokemon.attacks} />
          </p>
        </article>
      </div>
      <div class="py-6 md:py-20"></div>
      <h4 class="font-bold text-lg pb-6">More pokemons</h4>
      <div class="flex flex-wrap justify-center sm:justify-normal gap-4">
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
