export function parseAiSeedScript(rawResultString: string): string {
  if (!rawResultString) return '';

  let cleanString = rawResultString.trim();

  cleanString = cleanString.replace(/\\n/g, '\n');
  return cleanString;
}
