import { Module } from '@nestjs/common';
import { BullmqModule } from '../../providers/bullmq/bullmq.module';
import { JobModule } from '../job/job.module';
import { JobSubscriptionController } from './job-subscription.controller';
import { JobSubscriptionProcessor } from './job-subscription.processor';
import { JobSubscriptionPublisher } from './job-subscription.publisher';
import { JobSubscriptionService } from './job-subscription.service';
import { MeController } from './me.controller';
import { PrismaModule } from 'src/providers/prisma/prisma.module';

@Module({
  imports: [BullmqModule, PrismaModule, JobModule],
  controllers: [JobSubscriptionController, MeController],
  providers: [
    JobSubscriptionPublisher,
    JobSubscriptionProcessor,
    JobSubscriptionService,
  ],
})
export class JobSubscriptionModule {}
