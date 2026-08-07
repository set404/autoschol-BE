import { Test, TestQuestion } from '@prisma/client';

export interface TestSummaryResponse {
  id: string;
  title: unknown;
  description: unknown;
  questionIds: string[];
}

type TestWithQuestions = Test & { questions: TestQuestion[] };

export function toTestSummaryResponse(test: TestWithQuestions): TestSummaryResponse {
  return {
    id: test.id,
    title: test.title,
    description: test.description,
    questionIds: [...test.questions].sort((a, b) => a.position - b.position).map((q) => q.questionId),
  };
}
