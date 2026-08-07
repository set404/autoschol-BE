import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';
import { TestSummaryResponse, toTestSummaryResponse } from './test.mapper';

const TEST_INCLUDE = { questions: true } as const;

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<TestSummaryResponse[]> {
    const tests = await this.prisma.test.findMany({
      include: TEST_INCLUDE,
      orderBy: { order: 'asc' },
    });
    return tests.map(toTestSummaryResponse);
  }

  async findByIdOrThrow(id: string): Promise<TestSummaryResponse> {
    const test = await this.prisma.test.findUnique({ where: { id }, include: TEST_INCLUDE });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return toTestSummaryResponse(test);
  }

  async create(dto: CreateTestDto): Promise<TestSummaryResponse> {
    const count = await this.prisma.test.count();
    const test = await this.prisma.test.create({
      data: {
        id: randomUUID(),
        title: dto.title as object,
        description: dto.description as object,
        order: count,
        questions: {
          create: dto.questionIds.map((questionId, position) => ({ questionId, position })),
        },
      },
      include: TEST_INCLUDE,
    });
    return toTestSummaryResponse(test);
  }

  async update(id: string, dto: UpdateTestDto): Promise<TestSummaryResponse> {
    await this.findByIdOrThrow(id);

    const test = await this.prisma.$transaction(async (tx) => {
      if (dto.questionIds) {
        await tx.testQuestion.deleteMany({ where: { testId: id } });
        await tx.testQuestion.createMany({
          data: dto.questionIds.map((questionId, position) => ({ testId: id, questionId, position })),
        });
      }

      return tx.test.update({
        where: { id },
        data: {
          title: dto.title as object | undefined,
          description: dto.description as object | undefined,
        },
        include: TEST_INCLUDE,
      });
    });

    return toTestSummaryResponse(test);
  }

  async remove(id: string): Promise<void> {
    await this.findByIdOrThrow(id);
    await this.prisma.test.delete({ where: { id } });
  }
}
