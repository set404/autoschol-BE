import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { AssignmentResponse, toAssignmentResponse } from './assignment.mapper';

const ASSIGNMENT_INCLUDE = { teacher: true, student: true } as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listAssignments(): Promise<AssignmentResponse[]> {
    const assignments = await this.prisma.teacherStudentAssignment.findMany({
      include: ASSIGNMENT_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return assignments.map(toAssignmentResponse);
  }

  async createAssignment(dto: CreateAssignmentDto): Promise<AssignmentResponse> {
    const [teacher, student] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.teacherId } }),
      this.prisma.user.findUnique({ where: { id: dto.studentId } }),
    ]);
    if (!teacher || teacher.role !== Role.TEACHER) {
      throw new BadRequestException('teacherId must reference a user with role TEACHER');
    }
    if (!student || student.role !== Role.STUDENT) {
      throw new BadRequestException('studentId must reference a user with role STUDENT');
    }

    const assignment = await this.prisma.teacherStudentAssignment.create({
      data: { teacherId: dto.teacherId, studentId: dto.studentId },
      include: ASSIGNMENT_INCLUDE,
    });
    return toAssignmentResponse(assignment);
  }

  async removeAssignment(id: string): Promise<void> {
    const assignment = await this.prisma.teacherStudentAssignment.findUnique({ where: { id } });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    await this.prisma.teacherStudentAssignment.delete({ where: { id } });
  }
}
