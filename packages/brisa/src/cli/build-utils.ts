import generateStaticExportOriginal from "@/utils/generate-static-export";
import * as logModule from "@/utils/log/log-build";

// TODO: It is a workaround to avoid flaky tests, since it
// does not work well to mock modules. This will not be
// needed when this Bun issue is fixed:
// https://github.com/oven-sh/bun/issues/6040
export const logTable = (v: { [key: string]: string }[]) =>
  logModule.logTable(v);
export const generateStaticExport = () => generateStaticExportOriginal();
