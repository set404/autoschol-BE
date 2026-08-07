import { Type } from 'class-transformer';
import { ArrayMinSize, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from '../../common/dto/localized-text.dto';

export class QuestionOptionDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  text!: LocalizedTextDto;
}

export class CreateQuestionDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  text!: LocalizedTextDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  info?: LocalizedTextDto;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  @ArrayMinSize(2)
  options!: QuestionOptionDto[];

  /** Index into `options` identifying the correct answer. */
  @IsInt()
  @Min(0)
  correctOptionIndex!: number;
}
