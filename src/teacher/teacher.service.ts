import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { toPublicUser, PublicUser } from '../users/user.mapper';
import { AttemptResponse, toAttemptResponse } from '../attempts/attempt.mapper';

export interface StudentStats {
  testsTaken: number;
  averageScorePercent: number;
  missedQuestionCount: number;
}

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAssigned(teacherId: string, studentId: string): Promise<void> {
    const assignment = await this.prisma.teacherStudentAssignment.findUnique({
      where: { teacherId_studentId: { teacherId, studentId } },
    });
    if (!assignment) {
      throw new ForbiddenException('This student is not assigned to you');
    }
  }

  async listStudents(teacherId: string): Promise<PublicUser[]> {
    const assignments = await this.prisma.teacherStudentAssignment.findMany({
      where: { teacherId },
      include: { student: true },
      orderBy: { createdAt: 'asc' },
    });
    return assignments.map((a) => toPublicUser(a.student));
  }

  async listStudentAttempts(teacherId: string, studentId: string): Promise<AttemptResponse[]> {
    await this.assertAssigned(teacherId, studentId);
    const attempts = await this.prisma.testAttempt.findMany({
      where: { userId: studentId },
      orderBy: { completedAt: 'desc' },
    });
    return attempts.map(toAttemptResponse);
  }

  async getStudentStats(teacherId: string, studentId: string): Promise<StudentStats> {
    await this.assertAssigned(teacherId, studentId);

    const [attempts, missedQuestionCount] = await Promise.all([
      this.prisma.testAttempt.findMany({ where: { userId: studentId }, select: { percentage: true } }),
      this.prisma.missedQuestion.count({ where: { userId: studentId } }),
    ]);

    const testsTaken = attempts.length;
    const averageScorePercent =
      testsTaken === 0 ? 0 : Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / testsTaken);

    return { testsTaken, averageScorePercent, missedQuestionCount };
  }
}
