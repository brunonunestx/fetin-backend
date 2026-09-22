import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '../../generated/prisma/client';
import { SUBSCRIPTION_QUEUE } from '../../providers/bullmq/bullmq.queues';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { RedisKeyBuilder } from '../../providers/redis/redis.key-builder';
import { RedisProvider } from '../../providers/redis/redis.provider';
import { JobSubscriptionJobData } from './job-subscription.publisher';

const LOCK_TTL_MS = 5 * 60 * 1000;
const JOB_OPERATOR_TTL_MS = 5 * 60 * 1000;
const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

@Processor(SUBSCRIPTION_QUEUE)
export class JobSubscriptionProcessor extends WorkerHost {
  private readonly logger = new Logger(JobSubscriptionProcessor.name);

  constructor(
    private readonly redis: RedisProvider,
    private readonly prisma: PrismaProvider,
  ) {
    super();
  }

  async process(job: Job<JobSubscriptionJobData>): Promise<void> {
    const { jobId, operatorId } = job.data;

    const lockKey = RedisKeyBuilder.getLockKey(jobId);
    const acquiredLock = await this.redis.lock(
      lockKey,
      operatorId,
      LOCK_TTL_MS,
    );

    if (!acquiredLock) {
      this.logger.log(
        `Duplicate confirmation for job ${jobId} ignored: lock not acquired`,
      );
      return;
    }

    const jobOperatorKey = RedisKeyBuilder.getJobOperatorKey(jobId);
    const existingOperatorId = await this.redis.get(jobOperatorKey);

    if (existingOperatorId) {
      this.logger.log(
        `Duplicate confirmation for job ${jobId} ignored: already confirmed for ${existingOperatorId}`,
      );
      return;
    }

    await this.redis.set(jobOperatorKey, operatorId, JOB_OPERATOR_TTL_MS);

    try {
      await this.prisma.$transaction([
        this.prisma.jobSubscription.create({
          data: { jobId, operatorId },
        }),
        this.prisma.jobCandidate.update({
          where: { jobId_operatorId: { jobId, operatorId } },
          data: { status: 'CONFIRMED' },
        }),
        this.prisma.jobCandidate.updateMany({
          where: { jobId, operatorId: { not: operatorId }, status: 'PENDING' },
          data: { status: 'REJECTED' },
        }),
      ]);

      this.logger.log(
        `Local confirmed operator ${operatorId} for job ${jobId}`,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_CONSTRAINT_VIOLATION
      ) {
        this.logger.log(
          `Operator ${operatorId} lost the race for job ${jobId}: already subscribed`,
        );
        return;
      }

      throw error;
    }
  }
}
