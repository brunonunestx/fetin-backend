import { Module } from '@nestjs/common';
import { BullmqModule } from '../../providers/bullmq/bullmq.module';
import { JobSubscriptionController } from './job-subscription.controller';
import { JobSubscriptionProcessor } from './job-subscription.processor';
import { JobSubscriptionPublisher } from './job-subscription.publisher';

@Module({
  imports: [BullmqModule],
  controllers: [JobSubscriptionController],
  providers: [JobSubscriptionPublisher, JobSubscriptionProcessor],
})
export class JobSubscriptionModule {}
