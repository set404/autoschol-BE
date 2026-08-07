import { Question, QuestionOption } from '@prisma/client';

export interface QuestionOptionResponse {
  id: string;
  text: unknown;
}

export interface QuestionResponse {
  id: string;
  imageUrl?: string | null;
  text: unknown;
  options: QuestionOptionResponse[];
  correctOptionId: string;
  info?: unknown;
}

type QuestionWithOptions = Question & { options: QuestionOption[] };

export function toQuestionResponse(question: QuestionWithOptions): QuestionResponse {
  return {
    id: question.id,
    imageUrl: question.imageUrl ?? undefined,
    text: question.text,
    options: question.options.map((o) => ({ id: o.id, text: o.text })),
    correctOptionId: question.correctOptionId,
    info: question.info ?? undefined,
  };
}
