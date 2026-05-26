export function parseAiChallenge(responseString: string) {
  const extractField = (fieldPattern: string, nextFields: string[]): string => {
    const lookaheadElements = nextFields.map((f) => `${f}:`);
    const nextFieldsPattern =
      lookaheadElements.length > 0
        ? `(?=${lookaheadElements.join('|')}|$)`
        : '$';

    const regex = new RegExp(
      `${fieldPattern}:\\s*([\\s\\S]*?)${nextFieldsPattern}`,
      'i',
    );
    const match = responseString.match(regex);

    if (!match) return '';

    let value = match[1].trim();

    return value;
  };

  const title = extractField('title', ['description']);
  const description = extractField('description', ['difficulty']);
  const difficulty = extractField('difficulty', ['visibility']);
  const visibility = extractField('visibility', [
    'database_engine',
    'databaseEngine',
  ]);

  const databaseEngine = extractField('(?:database_engine|databaseEngine)', [
    'schema_definition',
  ]);

  const schemaDefinition = extractField('schema_definition', ['seed_script']);
  const seedScript = extractField('seed_script', ['expected_result']);
  const expectedResult = extractField('expected_result', ['time_limit_ms']);
  const timeLimitMsString = extractField('time_limit_ms', []);

  return {
    title,
    description,
    difficulty: (difficulty.toUpperCase() || 'EASY') as any,
    visibility: visibility || 'PUBLIC',
    databaseEngine: databaseEngine || 'PostgreSQL', // Mapeo a camelCase para el Front
    schemaDefinition,
    seedScript,
    expectedResult,
    timeLimitMs: Number(timeLimitMsString) || 100,
  };
}
