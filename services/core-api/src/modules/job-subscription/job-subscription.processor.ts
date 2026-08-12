import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SUBSCRIPTION_QUEUE } from '../../providers/bullmq/bullmq.queues';
import { JobSubscriptionJobData } from './job-subscription.publisher';

@Processor(SUBSCRIPTION_QUEUE)
export class JobSubscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(JobSubscriptionProcessor.name);

  async process(job: Job<JobSubscriptionJobData>): Promise<void> {
    this.logger.log(
      `Processing subscription of operator ${job.data.operatorId} to job ${job.data.jobId}`,
    );
  }
}
