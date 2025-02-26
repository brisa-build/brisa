export type WCs = Record<string, string>;
export type WCsEntrypoints = Record<string, WCs>;

export type Options = {
  webComponentsPerEntrypoint: WCsEntrypoints;
  layoutWebComponents: WCs;
  allWebComponents: WCs;
  integrationsPath?: string | null;
  layoutHasContextProvider?: boolean;
};

export type EntryPointData = {
  unsuspense: string;
  rpc: string;
  useContextProvider: boolean;
  lazyRPC: string;
  size: number;
  useI18n: boolean;
  i18nKeys: Set<string>;
  code: string;
  entrypoint?: string;
  useWebContextPlugins?: boolean;
  pagePath: string;
  index?: number;
  webComponents?: WCs;
};
