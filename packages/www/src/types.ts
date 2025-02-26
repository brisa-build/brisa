export type Item = {
  text: string;
  collapsed?: boolean;
  id?: string;
  link?: string;
  items?: Item[];
};

export type Config = {
  sidebar: Item[];
};
