import { greenLog, redLog, yellowLog } from '../log/log-color';

const BYTE_UNITS = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export default function byteSizeToString(
  byteCount: number,
  decimals = 2,
  useColors = false,
) {
  if (byteCount < 0) return 'Invalid byteCount';
  if (byteCount === 0) return useColors ? greenLog('0 B') : '0 B';

  const index = Math.floor(Math.log(byteCount) / Math.log(1000));

  let method = greenLog;

  // 70kb
  if (byteCount > 70000) method = yellowLog;

  // 100kb
  if (byteCount > 100000) method = redLog;

  const res = `${(byteCount / Math.pow(1000, index)).toFixed(decimals)} ${BYTE_UNITS[index]}`;

  return useColors ? method(res) : res;
}
