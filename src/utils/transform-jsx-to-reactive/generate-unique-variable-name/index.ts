export default function generateUniqueVariableName(
  baseName: string,
  existingNames: Set<string>,
): string {
  let uniqueName = baseName;
  while (existingNames.has(uniqueName)) {
    uniqueName += "$";
  }
  return uniqueName;
}
