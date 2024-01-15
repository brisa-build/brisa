import { getConstants } from "@/constants";

const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

export default function byteSizeToString(
  byteCount: number,
  decimals = 2,
  useColors = false,
) {
  const green = (text: string) =>
    Bun.enableANSIColors && useColors ? `\x1b[32m${text}\x1b[0m` : text;
  const yellow = (text: string) =>
    Bun.enableANSIColors && useColors ? `\x1b[33m${text}\x1b[0m` : text;
  const red = (text: string) =>
    Bun.enableANSIColors && useColors ? `\x1b[31m${text}\x1b[0m` : text;

  if (byteCount < 0) return "Invalid byteCount";
  if (byteCount === 0) return green("0 B");

  const index = Math.floor(Math.log(byteCount) / Math.log(1000));

  let method = green;

  // 70kb
  if (byteCount > 70000) {
    method = yellow;
  }

  // 100kb
  if (byteCount > 100000) {
    method = red;
  }

  return method(
    `${(byteCount / Math.pow(1000, index)).toFixed(decimals)} ${
      BYTE_UNITS[index]
    }`,
  );
}
