import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsString, ValidateNested } from 'class-validator';
import { LocalizedTextDto } from '../../common/dto/localized-text.dto';

export class CreateTestDto {
  @ValidateNested()
  @Type(() => LocalizedTextDto)
  title!: LocalizedTextDto;

  @ValidateNested()
  @Type(() => LocalizedTextDto)
  description!: LocalizedTextDto;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  questionIds!: string[];
}
