export type Animal = { id: string; name: string };

export type AnimalInfo = Animal & {
  hasTail?: boolean;
  abilities?: string[];
  image?: string;
};
