import { Controller, Get, Param } from '@nestjs/common';
import { Role } from '@prisma/client';
import { TeacherService, StudentStats } from './teacher.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';
import type { PublicUser } from '../users/user.mapper';
import type { AttemptResponse } from '../attempts/attempt.mapper';

@Controller('teacher')
@Roles(Role.TEACHER)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('students')
  listStudents(@CurrentUser() user: AuthenticatedUser): Promise<PublicUser[]> {
    return this.teacherService.listStudents(user.id);
  }

  @Get('students/:studentId/attempts')
  listStudentAttempts(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ): Promise<AttemptResponse[]> {
    return this.teacherService.listStudentAttempts(user.id, studentId);
  }

  @Get('students/:studentId/stats')
  getStudentStats(
    @CurrentUser() user: AuthenticatedUser,
    @Param('studentId') studentId: string,
  ): Promise<StudentStats> {
    return this.teacherService.getStudentStats(user.id, studentId);
  }
}
