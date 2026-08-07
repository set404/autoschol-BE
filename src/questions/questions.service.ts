import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionResponse, toQuestionResponse } from './question.mapper';

const QUESTION_INCLUDE = { options: true } as const;

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByIds(ids: string[]): Promise<QuestionResponse[]> {
    if (ids.length === 0) return [];
    const questions = await this.prisma.question.findMany({
      where: { id: { in: ids } },
      include: QUESTION_INCLUDE,
    });
    const byId = new Map(questions.map((q) => [q.id, q]));
    return ids
      .map((id) => byId.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
      .map(toQuestionResponse);
  }

  async findByIdOrThrow(id: string): Promise<QuestionResponse> {
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: QUESTION_INCLUDE,
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return toQuestionResponse(question);
  }

  async create(dto: CreateQuestionDto): Promise<QuestionResponse> {
    const question = await this.prisma.$transaction(async (tx) => {
      const created = await tx.question.create({
        data: {
          id: randomUUID(),
          text: dto.text as object,
          info: (dto.info as object) ?? undefined,
          imageUrl: dto.imageUrl,
          correctOptionId: '',
          options: {
            create: dto.options.map((o) => ({ text: o.text as object })),
          },
        },
        include: QUESTION_INCLUDE,
      });

      const correctOption = created.options[dto.correctOptionIndex];
      if (!correctOption) {
        throw new NotFoundException('correctOptionIndex is out of range for the given options');
      }

      return tx.question.update({
        where: { id: created.id },
        data: { correctOptionId: correctOption.id },
        include: QUESTION_INCLUDE,
      });
    });

    return toQuestionResponse(question);
  }

  async update(id: string, dto: UpdateQuestionDto): Promise<QuestionResponse> {
    await this.findByIdOrThrow(id);

    const question = await this.prisma.$transaction(async (tx) => {
      if (dto.options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        await tx.questionOption.createMany({
          data: dto.options.map((o) => ({ questionId: id, text: o.text as object })),
        });
      }

      const updated = await tx.question.update({
        where: { id },
        data: {
          text: dto.text as object | undefined,
          info: dto.info === undefined ? undefined : (dto.info as object),
          imageUrl: dto.imageUrl,
        },
        include: QUESTION_INCLUDE,
      });

      if (dto.options && dto.correctOptionIndex !== undefined) {
        const correctOption = updated.options[dto.correctOptionIndex];
        if (!correctOption) {
          throw new NotFoundException('correctOptionIndex is out of range for the given options');
        }
        return tx.question.update({
          where: { id },
          data: { correctOptionId: correctOption.id },
          include: QUESTION_INCLUDE,
        });
      }

      return updated;
    });

    return toQuestionResponse(question);
  }

  async remove(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.question.delete({ where: { id } });
  }
}
