import { IsString, MinLength } from 'class-validator';

export class LocalizedTextDto {
  @IsString()
  @MinLength(1)
  hy!: string;

  @IsString()
  @MinLength(1)
  en!: string;

  @IsString()
  @MinLength(1)
  ru!: string;
}
