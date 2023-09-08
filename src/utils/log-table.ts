export default function logTable(data: { [key: string]: string }[]) {
  const headers = Object.keys(data[0]);
  const maxLengths = headers.map(header => data.reduce((max, item) => Math.max(max, item[header].length), 0));
  let lines = [];

  // Headers
  lines.push(headers.map((header, i) => header.padEnd(maxLengths[i])).join(' | '));

  // Separators
  lines.push('-'.repeat(maxLengths.reduce((total, len) => total + len + 3, 0)));

  // Rows 
  for (const item of data) {
    const cells = headers.map((header, i) => item[header].padEnd(maxLengths[i]));
    lines.push(cells.join(' | '));
  }

  console.log(lines.join('\n'));
}
