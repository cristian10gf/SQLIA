import type { SubmissionStatusValue } from '../entities/submission.entity';

export function mapPgExecutionError(err: unknown): SubmissionStatusValue {
  const any = err as { code?: string; message?: string };
  const code = any.code ? String(any.code) : '';
  const msg = (any.message || '').toLowerCase();
  if (
    code === '57014' ||
    msg.includes('statement timeout') ||
    msg.includes('canceling statement')
  ) {
    return 'TIME_LIMIT_EXCEEDED';
  }
  if (code.startsWith('42')) {
    return 'SYNTAX_ERROR';
  }
  return 'RUNTIME_ERROR';
}
