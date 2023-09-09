const BYTE_UNITS = ["B", "kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

export default function byteSizeToString(byteCount: number, decimals = 2) {
  if (byteCount < 0) return "Invalid byteCount";
  if (byteCount === 0) return "0 B";

  const index = Math.floor(Math.log(byteCount) / Math.log(1000));

  return `${(byteCount / Math.pow(1000, index)).toFixed(decimals)} ${
    BYTE_UNITS[index]
  }`;
}
