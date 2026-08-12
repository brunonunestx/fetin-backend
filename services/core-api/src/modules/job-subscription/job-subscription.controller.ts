import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ScheduleJobSubscriptionDto } from './dto/schedule-job-subscription.dto';
import { JobSubscriptionPublisher } from './job-subscription.publisher';

@Controller('vagas')
export class JobSubscriptionController {
  constructor(private readonly publisher: JobSubscriptionPublisher) {}

  @Post(':id/agendar')
  async schedule(
    @Param('id', ParseUUIDPipe) jobId: string,
    @Body() body: ScheduleJobSubscriptionDto,
  ): Promise<void> {
    await this.publisher.publish({
      jobId,
      operatorId: body.operatorId,
    });
  }
}
