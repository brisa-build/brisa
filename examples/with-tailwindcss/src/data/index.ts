export enum PokemonCategory {
  Fire = 'fire',
  Water = 'water',
  Grass = 'grass',
  Electric = 'electric',
}

export interface Pokemon {
  id: number;
  name: string;
  slug: string;
  description: string;
  cover: string;
  attacks: {
    name: string;
    power: number;
  }[];
  category: PokemonCategory;
}

export const pokemons: Pokemon[] = [
  {
    id: 32,
    name: 'Charmander',
    slug: 'charmander',
    description:
      'Charmander is a Fire-type Pokémon. It evolves into Charmeleon starting at level 16. It is one of the three Starter Pokémon introduced in the Kanto region.',
    cover: '/pokemons/charmander.jpg',
    attacks: [
      {
        name: 'Ember',
        power: 40,
      },
      {
        name: 'Scratch',
        power: 40,
      },
    ],
    category: PokemonCategory.Fire,
  },
  {
    id: 18,
    name: 'Pikachu',
    slug: 'pikachu',
    description:
      'Pikachu is an Electric-type Pokémon. It evolves from Pichu when leveled up with high friendship and evolves into Raichu when exposed to a Thunder Stone.',
    cover: '/pokemons/pika.jpeg',
    category: PokemonCategory.Electric,
    attacks: [
      {
        name: 'Thunder Shock',
        power: 40,
      },
      {
        name: 'Quick Attack',
        power: 40,
      },
    ],
  },
  {
    id: 21,
    name: 'Bulbasaur',
    slug: 'bulbasaur',
    description:
      'Bulbasaur is a Grass/Poison-type Pokémon. It evolves into Ivysaur starting at level 16. It is one of the three Starter Pokémon introduced in the Kanto region.',
    cover: '/pokemons/bulbasaur.jpg',
    category: PokemonCategory.Grass,
    attacks: [
      {
        name: 'Tackle',
        power: 40,
      },
      {
        name: 'Vine Whip',
        power: 40,
      },
    ],
  },
  {
    id: 49,
    name: 'Squirtle',
    slug: 'squirtle',
    description:
      'Squirtle is a Water-type Pokémon. It evolves into Wartortle starting at level 16. It is one of the three Starter Pokémon introduced in the Kanto region.',
    cover: '/pokemons/squirtle.jpeg',
    category: PokemonCategory.Water,
    attacks: [
      {
        name: 'Tackle',
        power: 40,
      },
      {
        name: 'Water Gun',
        power: 40,
      },
    ],
  },
];
