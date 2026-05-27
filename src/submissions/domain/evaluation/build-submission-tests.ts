import type { TestCaseResult } from '../scoring/submission-scoring';

interface ExpectedCase {
  caseId?: number;
  expectedRows?: number;
  expectedPayload?: unknown;
}

interface ExpectedResultWithCases {
  cases?: ExpectedCase[];
}

interface ExpectedResultWithData {
  data?: unknown;
  rowCount?: number;
}

function stableSerialize(value: unknown): string {
  const norm = (v: unknown): unknown => {
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(norm);
    const o = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o).sort()) {
      out[k] = norm(o[k]);
    }
    return out;
  };
  return JSON.stringify(norm(value));
}

function buildCaseTests(
  cases: ExpectedCase[],
  rows: unknown[],
): TestCaseResult[] {
  const tests: TestCaseResult[] = [];
  let idx = 0;
  for (const c of cases) {
    idx += 1;
    const caseId = c.caseId ?? idx;
    let passed = true;
    let detail: string | undefined;
    if (
      typeof c.expectedRows === 'number' &&
      c.expectedRows !== rows.length
    ) {
      passed = false;
      detail = `Se esperaban ${c.expectedRows} filas, hay ${rows.length}`;
    }
    if (
      passed &&
      c.expectedPayload !== undefined &&
      c.expectedPayload !== null
    ) {
      if (stableSerialize(rows) !== stableSerialize(c.expectedPayload)) {
        passed = false;
        detail = 'expectedPayload no coincide con el resultado';
      }
    }
    tests.push({ caseId, passed, detail });
  }
  return tests;
}

function buildDefaultTest(
  expectedResult: unknown,
  rows: unknown[],
): TestCaseResult[] {
  let expectedPayload: unknown = expectedResult;
  let expectedRowCount: number | undefined;

  if (Array.isArray(expectedResult)) {
    expectedPayload = expectedResult;
    expectedRowCount = expectedResult.length;
  } else if (expectedResult !== null && typeof expectedResult === 'object') {
    const withData = expectedResult as ExpectedResultWithData;
    if ('data' in withData) {
      expectedPayload = withData.data;
      if (typeof withData.rowCount === 'number') {
        expectedRowCount = withData.rowCount;
      }
    }
  }

  let passed = true;
  let detail: string | undefined;

  if (typeof expectedRowCount === 'number' && expectedRowCount !== rows.length) {
    passed = false;
    detail = `Se esperaban ${expectedRowCount} filas, hay ${rows.length}`;
  }

  if (passed && expectedPayload !== undefined) {
    if (stableSerialize(rows) !== stableSerialize(expectedPayload)) {
      passed = false;
      detail = detail ?? 'Resultado distinto al esperado';
    }
  }

  return [{ caseId: 1, passed, detail }];
}

/**
 * Construye casos de prueba a partir de `challenge.expectedResult`.
 * Soporta `{ cases: [...] }` y el formato `{ data, rowCount }` del frontend.
 */
export function buildSubmissionTests(
  expectedResult: unknown,
  rows: unknown[],
): TestCaseResult[] {
  const shape = expectedResult as ExpectedResultWithCases | null;
  if (shape && Array.isArray(shape.cases) && shape.cases.length > 0) {
    return buildCaseTests(shape.cases, rows);
  }
  return buildDefaultTest(expectedResult, rows);
}
