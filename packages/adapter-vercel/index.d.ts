import type { Adapter } from 'brisa';

export type Config = {
  /**
   * The `regions` property is an array of [edge network regions](https://vercel.com/docs/concepts/edge-network/regions).
   *
   * Default: `["iad1"]`.
   *
   * Note that multiple regions for serverless functions are only supported on Enterprise plans.
   */
  regions?: string[];

  /**
   * The `memory` property is the amount of memory available to the function.
   *
   * Default: `1024` Mb.
   *
   * The memory can be decreased to `128` Mb or [increased](https://vercel.com/docs/concepts/limits/overview#serverless-function-memory) in 64Mb increments up to `3008` Mb on Pro or Enterprise accounts.
   */
  memory?: number;

  /**
   * The `maxDuration` property is the [maximum execution duration](https://vercel.com/docs/functions/runtimes#max-duration) of the function.
   *
   * Default: `10` seconds for Hobby accounts, `15` for Pro and `900` for Enterprise.
   */
  maxDuration?: number;
};

export default function vercelAdapter(config?: Config): Adapter;
