import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AttemptResponse, toAttemptResponse } from './attempt.mapper';
import { QuestionResponse, toQuestionResponse } from '../questions/question.mapper';
import { PASS_RATIO } from './constants';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(userId: string, dto: SubmitAttemptDto): Promise<AttemptResponse> {
    const questions = await this.prisma.question.findMany({
      where: { id: { in: dto.questionIds } },
    });
    const questionById = new Map(questions.map((q) => [q.id, q]));

    const total = dto.questionIds.length;
    let score = 0;
    const answerRows: { questionId: string; selectedOptionId: string; correct: boolean }[] = [];
    const missedToUpsert: string[] = [];
    const missedToClear: string[] = [];

    for (const questionId of dto.questionIds) {
      const question = questionById.get(questionId);
      const selectedOptionId = dto.answers[questionId];
      if (!question || selectedOptionId === undefined) {
        continue; // skipped question — not scored, missed-set left untouched
      }
      const correct = selectedOptionId === question.correctOptionId;
      if (correct) {
        score += 1;
        missedToClear.push(questionId);
      } else {
        missedToUpsert.push(questionId);
      }
      answerRows.push({ questionId, selectedOptionId, correct });
    }

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const passed = percentage >= Math.round(PASS_RATIO * 100);

    const attempt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.testAttempt.create({
        data: {
          userId,
          testId: dto.testId ?? null,
          testTitle: dto.testTitle as object,
          score,
          total,
          percentage,
          passed,
          elapsedSeconds: dto.elapsedSeconds,
          answers: { create: answerRows },
        },
      });

      if (missedToClear.length > 0) {
        await tx.missedQuestion.deleteMany({
          where: { userId, questionId: { in: missedToClear } },
        });
      }
      for (const questionId of missedToUpsert) {
        await tx.missedQuestion.upsert({
          where: { userId_questionId: { userId, questionId } },
          create: { userId, questionId },
          update: { missedAt: new Date() },
        });
      }

      return created;
    });

    return toAttemptResponse(attempt);
  }

  async findAllForUser(userId: string): Promise<AttemptResponse[]> {
    const attempts = await this.prisma.testAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });
    return attempts.map(toAttemptResponse);
  }

  async findOneForUser(userId: string, id: string): Promise<AttemptResponse & { answers: unknown[] }> {
    const attempt = await this.prisma.testAttempt.findFirst({
      where: { id, userId },
      include: { answers: true },
    });
    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }
    return { ...toAttemptResponse(attempt), answers: attempt.answers };
  }

  async findMissedQuestionsForUser(userId: string): Promise<QuestionResponse[]> {
    const missed = await this.prisma.missedQuestion.findMany({
      where: { userId },
      orderBy: { missedAt: 'desc' },
      include: { question: { include: { options: true } } },
    });
    return missed.map((m) => toQuestionResponse(m.question));
  }
}
