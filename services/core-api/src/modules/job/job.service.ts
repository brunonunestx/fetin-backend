import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Job } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { CreateJobDto } from './dto/create-job.dto';

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
}
