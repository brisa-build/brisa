const SNAKE_TO_CAMEL_CASE_REGEX = /([-_]([a-z]|[0-9]))/g;

export default function snakeToCamelCase(str: string) {
  return str
    .toLowerCase()
    .replace(SNAKE_TO_CAMEL_CASE_REGEX, replaceSnakeToCamelCase);
}

function replaceSnakeToCamelCase(group: string) {
  return group.toUpperCase().replace("-", "").replace("_", "");
}
