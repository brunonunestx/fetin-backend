import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SUBSCRIPTION_QUEUE } from '../../providers/bullmq/bullmq.queues';

export interface JobSubscriptionJobData {
  jobId: string;
  operatorId: string;
}

@Injectable()
export class JobSubscriptionPublisher {
  constructor(
    @InjectQueue(SUBSCRIPTION_QUEUE)
    private readonly queue: Queue<JobSubscriptionJobData>,
  ) {}

  async publish(data: JobSubscriptionJobData): Promise<void> {
    await this.queue.add(SUBSCRIPTION_QUEUE, data);
  }
}
