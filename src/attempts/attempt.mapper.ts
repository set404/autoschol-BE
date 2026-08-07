import { TestAttempt } from '@prisma/client';

export interface AttemptResponse {
  id: string;
  testId: string | null;
  testTitle: unknown;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  elapsedSeconds: number;
  completedAt: number;
}

export function toAttemptResponse(attempt: TestAttempt): AttemptResponse {
  return {
    id: attempt.id,
    testId: attempt.testId,
    testTitle: attempt.testTitle,
    score: attempt.score,
    total: attempt.total,
    percentage: attempt.percentage,
    passed: attempt.passed,
    elapsedSeconds: attempt.elapsedSeconds,
    completedAt: attempt.completedAt.getTime(),
  };
}
