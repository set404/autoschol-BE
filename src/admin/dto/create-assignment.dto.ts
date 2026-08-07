import { IsString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  teacherId!: string;

  @IsString()
  studentId!: string;
}
