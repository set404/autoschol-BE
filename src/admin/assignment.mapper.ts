import { TeacherStudentAssignment, User } from '@prisma/client';
import { PublicUser, toPublicUser } from '../users/user.mapper';

export interface AssignmentResponse {
  id: string;
  createdAt: Date;
  teacher: PublicUser;
  student: PublicUser;
}

type AssignmentWithUsers = TeacherStudentAssignment & { teacher: User; student: User };

export function toAssignmentResponse(assignment: AssignmentWithUsers): AssignmentResponse {
  return {
    id: assignment.id,
    createdAt: assignment.createdAt,
    teacher: toPublicUser(assignment.teacher),
    student: toPublicUser(assignment.student),
  };
}
