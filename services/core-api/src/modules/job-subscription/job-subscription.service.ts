import { ConflictException, Injectable } from '@nestjs/common';
import { JobService } from '../job/job.service';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { RedisKeyBuilder } from '../../providers/redis/redis.key-builder';
import { RedisProvider } from '../../providers/redis/redis.provider';
import { AcceptedJobDto } from './dto/accepted-job.dto';
import {
  JobSubscriptionStatus,
  JobSubscriptionStatusDto,
} from './dto/job-subscription-status.dto';
import {
  JobSubscriptionJobData,
  JobSubscriptionPublisher,
} from './job-subscription.publisher';

@Injectable()
export class JobSubscriptionService {
  constructor(
    private readonly publisher: JobSubscriptionPublisher,
    private readonly redis: RedisProvider,
    private readonly prisma: PrismaProvider,
    private readonly jobService: JobService,
  ) {}

  async schedule(data: JobSubscriptionJobData): Promise<void> {
    const job = await this.jobService.findById(data.jobId);

    if (job.cancelledAt) {
      throw new ConflictException({
        code: 'JOB_CANCELLED',
        message: 'Vaga cancelada não pode ser aceita',
      });
    }

    await this.publisher.publish(data);
  }

  async getAcceptStatus(jobId: string): Promise<JobSubscriptionStatusDto> {
    const jobOperatorKey = RedisKeyBuilder.getJobOperatorKey(jobId);
    const cachedOperatorId = await this.redis.get(jobOperatorKey);

    if (cachedOperatorId) {
      return {
        status: JobSubscriptionStatus.FINISHED,
        operatorId: cachedOperatorId,
      };
    }

    const subscription = await this.prisma.jobSubscription.findUnique({
      where: { jobId },
    });

    if (subscription) {
      return {
        status: JobSubscriptionStatus.FINISHED,
        operatorId: subscription.operatorId,
      };
    }

    return { status: JobSubscriptionStatus.PENDING, operatorId: '' };
  }

  async findAcceptedByOperator(operatorId: string): Promise<AcceptedJobDto[]> {
    const subscriptions = await this.prisma.jobSubscription.findMany({
      where: { operatorId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (subscriptions.length === 0) {
      return [];
    }

    const jobs = await this.jobService.findManyByIds(
      subscriptions.map((subscription) => subscription.jobId),
    );
    const jobsById = new Map(jobs.map((job) => [job.id, job]));

    return subscriptions.flatMap((subscription) => {
      const job = jobsById.get(subscription.jobId);

      if (!job) {
        return [];
      }

      return [
        {
          jobId: job.id,
          title: job.title,
          description: job.description,
          startsAt: job.startsAt,
          durationMinutes: job.durationMinutes,
          value: job.value,
          localId: job.localId,
          acceptedAt: subscription.createdAt,
        },
      ];
    });
  }
}
