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
import { FindJobsDto } from './dto/find-jobs.dto';
import { JobResponseDto } from './dto/job-response.dto';

const EARTH_RADIUS_KM = 6371;

interface Coordinates {
  lat: number;
  lng: number;
}

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

  async findAll(filters: FindJobsDto = {}): Promise<JobResponseDto[]> {
    const { localId, lat, lng, radiusKm } = filters;

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
    const origin: Coordinates | null =
      lat !== undefined && lng !== undefined ? { lat, lng } : null;

    const responses = jobs.map((job) => {
      const local = this.getLocalOrThrow(job.localId, localsById);

      return this.toJobResponse(
        job,
        local,
        filledJobIds.has(job.id),
        origin ? this.distanceToLocal(origin, local) : undefined,
      );
    });

    if (!origin) {
      return responses;
    }

    return responses
      .filter(
        (response) =>
          response.distanceKm !== undefined &&
          (radiusKm === undefined || response.distanceKm <= radiusKm),
      )
      .sort((a, b) => a.distanceKm! - b.distanceKm!);
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
    distanceKm?: number,
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
      distanceKm,
    };
  }

  private distanceToLocal(
    origin: Coordinates,
    local: Local,
  ): number | undefined {
    if (local.latitude === null || local.longitude === null) {
      return undefined;
    }

    return this.haversineDistanceKm(origin, {
      lat: local.latitude,
      lng: local.longitude,
    });
  }

  private haversineDistanceKm(from: Coordinates, to: Coordinates): number {
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = toRadians(to.lat - from.lat);
    const dLng = toRadians(to.lng - from.lng);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(from.lat)) *
        Math.cos(toRadians(to.lat)) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_KM * c;
  }
}
