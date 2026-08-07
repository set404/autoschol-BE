import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from '../../common/dto/localized-text.dto';

export class SubmitAttemptDto {
  @IsOptional()
  @IsString()
  testId?: string;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  testTitle!: LocalizedTextDto;

  /** Every question presented in this session, in display order — including skipped ones. */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  questionIds!: string[];

  /** Map of questionId -> selectedOptionId. Skipped questions are simply absent. */
  @IsObject()
  answers!: Record<string, string>;

  @IsInt()
  @Min(0)
  elapsedSeconds!: number;
}
