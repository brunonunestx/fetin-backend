import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { JobSubscriptionStatusDto } from './dto/job-subscription-status.dto';
import { ScheduleJobSubscriptionDto } from './dto/schedule-job-subscription.dto';
import { JobSubscriptionService } from './job-subscription.service';

@Controller('vagas')
export class JobSubscriptionController {
  constructor(
    private readonly jobSubscriptionService: JobSubscriptionService,
  ) {}

  @Post(':id/agendar')
  async schedule(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() body: ScheduleJobSubscriptionDto,
  ): Promise<void> {
    await this.jobSubscriptionService.schedule({
      jobId,
      operatorId: body.operatorId,
    });
  }

  @Get(':id/agendado')
  async getAcceptStatus(
    @Param('id', ParseUUIDPipe) jobId: string,
  ): Promise<JobSubscriptionStatusDto> {
    return this.jobSubscriptionService.getAcceptStatus(jobId);
  }
}
