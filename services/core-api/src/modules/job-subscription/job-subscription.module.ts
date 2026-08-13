import { Module } from '@nestjs/common';
import { BullmqModule } from '../../providers/bullmq/bullmq.module';
import { JobSubscriptionController } from './job-subscription.controller';
import { JobSubscriptionProcessor } from './job-subscription.processor';
import { JobSubscriptionPublisher } from './job-subscription.publisher';
import { JobSubscriptionService } from './job-subscription.service';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [BullmqModule, PrismaModule],
  controllers: [JobSubscriptionController],
  providers: [JobSubscriptionPublisher, JobSubscriptionProcessor, JobSubscriptionService],
})
export class JobSubscriptionModule {}
