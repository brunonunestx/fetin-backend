import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SUBSCRIPTION_QUEUE } from '../../providers/bullmq/bullmq.queues';
import { RedisKeyBuilder } from '../../providers/redis/redis.key-builder';
import { RedisProvider } from '../../providers/redis/redis.provider';
import { JobSubscriptionJobData } from './job-subscription.publisher';

const LOCK_TTL_MS = 5 * 60 * 1000;
const JOB_OPERATOR_TTL_MS = 5 * 60 * 1000;

@Processor(SUBSCRIPTION_QUEUE)
export class JobSubscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(JobSubscriptionProcessor.name);

  constructor(private readonly redis: RedisProvider) {
    super();
  }

  async process(job: Job<JobSubscriptionJobData>): Promise<void> {
    const { jobId, operatorId } = job.data;

    const lockKey = RedisKeyBuilder.getLockKey(jobId);
    const acquiredLock = await this.redis.lock(lockKey, operatorId, LOCK_TTL_MS);

    if (!acquiredLock) {
      this.logger.log(`Operator ${operatorId} lost the race for job ${jobId}: lock not acquired`);
      return;
    }

    const jobOperatorKey = RedisKeyBuilder.getJobOperatorKey(jobId);
    const existingOperatorId = await this.redis.get(jobOperatorKey);

    if (existingOperatorId) {
      this.logger.log(
        `Operator ${operatorId} lost the race for job ${jobId}: jobOperator already set to ${existingOperatorId}`,
      );
      return;
    }

    await this.redis.set(jobOperatorKey, operatorId, JOB_OPERATOR_TTL_MS);
    this.logger.log(`Operator ${operatorId} won the race for job ${jobId}`);
  }
}
