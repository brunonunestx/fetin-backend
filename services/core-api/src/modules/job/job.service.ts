import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Job, Local } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { toLocalSummary } from '../local/dto/local-summary.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { JobResponseDto } from './dto/job-response.dto';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaProvider) {}

  async create(ownerId: string, data: CreateJobDto): Promise<Job> {
    const local = await this.prisma.local.findUnique({
      where: { id: data.localId },
    });

    if (!local) {
      throw new NotFoundException({
        code: 'LOCAL_NOT_FOUND',
        message: 'Local não encontrado',
      });
    }

    if (local.ownerId !== ownerId) {
      throw new ForbiddenException({
        code: 'LOCAL_NOT_OWNED',
        message: 'Local não pertence ao usuário autenticado',
      });
    }

    return this.prisma.job.create({
      data: {
        localId: data.localId,
        title: data.title,
        description: data.description,
        startsAt: new Date(data.startsAt),
        durationMinutes: data.durationMinutes,
        value: data.value,
      },
    });
  }

  async findAll(localId?: string): Promise<JobResponseDto[]> {
    const jobs = await this.prisma.job.findMany({
      where: localId ? { localId } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    if (jobs.length === 0) {
      return [];
    }

    const jobIds = jobs.map((job) => job.id);
    const localIds = [...new Set(jobs.map((job) => job.localId))];
    const [subscriptions, locals] = await Promise.all([
      this.prisma.jobSubscription.findMany({
        where: { jobId: { in: jobIds }, deletedAt: null },
        select: { jobId: true },
      }),
      this.prisma.local.findMany({ where: { id: { in: localIds } } }),
    ]);
    const filledJobIds = new Set(
      subscriptions.map((subscription) => subscription.jobId),
    );
    const localsById = new Map(locals.map((local) => [local.id, local]));

    return jobs.map((job) =>
      this.toJobResponse(
        job,
        this.getLocalOrThrow(job.localId, localsById),
        filledJobIds.has(job.id),
      ),
    );
  }

  async findManyByIds(ids: string[]): Promise<Job[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.prisma.job.findMany({ where: { id: { in: ids } } });
  }

  async findById(id: string): Promise<Job> {
    const job = await this.prisma.job.findUnique({ where: { id } });

    if (!job) {
      throw new NotFoundException({
        code: 'JOB_NOT_FOUND',
        message: 'Vaga não encontrada',
      });
    }

    return job;
  }

  async findDetailsById(id: string): Promise<JobResponseDto> {
    const job = await this.findById(id);
    const [local, subscription] = await Promise.all([
      this.prisma.local.findUnique({ where: { id: job.localId } }),
      this.prisma.jobSubscription.findUnique({
        where: { jobId: job.id },
        select: { deletedAt: true },
      }),
    ]);

    if (!local) {
      throw new NotFoundException({
        code: 'LOCAL_NOT_FOUND',
        message: 'Local não encontrado',
      });
    }

    return this.toJobResponse(
      job,
      local,
      Boolean(subscription && !subscription.deletedAt),
    );
  }

  async cancel(ownerId: string, jobId: string): Promise<Job> {
    const job = await this.findById(jobId);

    const local = await this.prisma.local.findUnique({
      where: { id: job.localId },
    });

    if (!local || local.ownerId !== ownerId) {
      throw new ForbiddenException({
        code: 'LOCAL_NOT_OWNED',
        message: 'Local não pertence ao usuário autenticado',
      });
    }

    if (job.cancelledAt) {
      throw new ConflictException({
        code: 'JOB_ALREADY_CANCELLED',
        message: 'Vaga já foi cancelada',
      });
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: { cancelledAt: new Date() },
    });
  }

  private getLocalOrThrow(
    localId: string,
    localsById: Map<string, Local>,
  ): Local {
    const local = localsById.get(localId);

    if (!local) {
      throw new NotFoundException({
        code: 'LOCAL_NOT_FOUND',
        message: 'Local não encontrado',
      });
    }

    return local;
  }

  private toJobResponse(
    job: Job,
    local: Local,
    filled: boolean,
  ): JobResponseDto {
    return {
      id: job.id,
      localId: job.localId,
      title: job.title,
      description: job.description,
      startsAt: job.startsAt,
      durationMinutes: job.durationMinutes,
      value: job.value.toFixed(2),
      createdAt: job.createdAt,
      cancelledAt: job.cancelledAt,
      filled,
      local: toLocalSummary(local),
    };
  }
}
