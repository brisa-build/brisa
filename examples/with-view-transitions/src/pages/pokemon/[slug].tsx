import Attacks from '@/components/attacks';
import PokemonCard from '@/components/pokemon-card';
import { pokemons, type Pokemon } from '@/data';
import { dangerHTML, type RequestContext } from 'brisa';

export default function PokemonPage({}, { route }: RequestContext) {
  const slug = route.params!.slug;
  const pokemon = pokemons.find((p) => p.slug === slug) ?? ({} as Pokemon);

  return (
    <div className="max-w-4xl mx-auto relative">
      <div className="flex gap-2 pb-10 items-center text-gray-500">
        <a
          className="after:content-['/'] after:pl-2 capitalize"
          href="/"
          renderMode="transition"
        >
          Poke
        </a>
        <span className="after:content-['/'] after:pl-2 capitalize">
          {pokemon.category}
        </span>
        <span>{pokemon.name}</span>
      </div>
      <div className="flex flex-col md:flex-row sm sm:gap-8">
        <div className="max-w-[450px] w-full h-full max-h-[450px]">
          <img
            src={pokemon.cover}
            alt={pokemon.name}
            className="w-full h-full object-cover rounded-xl shadow-2xl shadow-gray-200 border-b"
            style={{
              'view-transition-name': `${slug}-image`,
            }}
          />
        </div>
        <article className="py-4 flex justify-between flex-col">
          <div>
            <h1 className="text-3xl sm:text-5xl font-bold animate-in">
              {pokemon.name}
            </h1>
            <div
              style={{
                'view-transition-name': `${slug}-title`,
              }}
            ></div>
            <p
              className="max-w-sm py-4 text-lg"
              style={{
                'view-transition-name': `${slug}-description`,
              }}
            >
              {pokemon.description}
            </p>
          </div>
          <p>
            <Attacks attacks={pokemon.attacks} />
          </p>
        </article>
      </div>
      <div className="py-6 md:py-20"></div>
      <h4 className="font-bold text-lg pb-6">More pokemons</h4>
      <div className="flex flex-wrap justify-center sm:justify-normal gap-4">
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
