import getConstants from "../../constants";

export function logTable(data: { [key: string]: string }[]) {
  const { LOG_PREFIX } = getConstants();
  const headers = Object.keys(data[0]);
  const maxLengths = headers.map((header) =>
    data.reduce(
      (max, item) => Math.max(max, item[header].length),
      header.length,
    ),
  );
  let lines = [];

  // Headers
  lines.push(
    headers.map((header, i) => header.padEnd(maxLengths[i])).join(" | "),
  );

  // Separators
  lines.push("-".repeat(maxLengths.reduce((total, len) => total + len + 3, 0)));

  // Rows
  for (const item of data) {
    const cells = headers.map((header, i) =>
      item[header].padEnd(maxLengths[i]),
    );
    lines.push(cells.join(" | "));
  }

  console.log(LOG_PREFIX.INFO);
  lines.forEach((line) => console.log(LOG_PREFIX.INFO, line));
}

function log(type: "Error" | "Warning") {
  const { LOG_PREFIX } = getConstants();
  const LOG =
    LOG_PREFIX[
      {
        Error: "ERROR",
        Warning: "WARN",
      }[type] as keyof typeof LOG_PREFIX
    ];

  return (messages: string[], footer?: string) => {
    console.log(LOG, `Ops! ${type}:`);
    console.log(LOG, "--------------------------");
    messages.forEach((message) => console.log(LOG, message));
    console.log(LOG, "--------------------------");
    if (footer) console.log(LOG, footer);
  };
}

export function logError(messages: string[], footer?: string) {
  return log("Error")(messages, footer);
}

export function logWarning(messages: string[], footer?: string) {
  return log("Warning")(messages, footer);
}
