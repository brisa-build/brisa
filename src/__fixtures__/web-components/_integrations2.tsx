import type { WebContextPlugin } from "brisa";

export const webContextPlugins: WebContextPlugin[] = [
  (ctx, extras) => {
    ctx.store.sync = (
      key: string,
      storage: "localStorage" | "sessionStorage" = "localStorage",
    ) => {
      // Skip execution on server side (SSR)
      if (typeof window === "undefined") return;

      // Sync from storage to store
      const sync = (event?: StorageEvent) => {
        if (event && event.key !== key) return;
        const storageValue = window[storage].getItem(key);
        if (storageValue != null) ctx.store.set(key, JSON.parse(storageValue));
      };

      // Add and remove "storage" event listener
      ctx.effect(() => {
        window.addEventListener("storage", sync);
        ctx.cleanup(() => window.removeEventListener("storage", sync));
      });

      // Update storage when store changes
      ctx.effect(() => {
        const val = ctx.store.get(key);
        if (val != null) window[storage].setItem(key, JSON.stringify(val));
      });

      sync();
    };

    // The ctx now has a new method "sync" that can be used to sync a
    // store key with localStorage
    return ctx;
  },
];
