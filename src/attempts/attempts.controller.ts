import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { AttemptsService } from './attempts.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import { AttemptResponse } from './attempt.mapper';
import { QuestionResponse } from '../questions/question.mapper';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Post()
  submit(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubmitAttemptDto): Promise<AttemptResponse> {
    return this.attemptsService.submit(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser): Promise<AttemptResponse[]> {
    return this.attemptsService.findAllForUser(user.id);
  }

  @Get('missed')
  findMissed(@CurrentUser() user: AuthenticatedUser): Promise<QuestionResponse[]> {
    return this.attemptsService.findMissedQuestionsForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.attemptsService.findOneForUser(user.id, id);
  }
}
