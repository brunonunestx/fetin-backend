import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Local } from '../../generated/prisma/client';
import { PrismaProvider } from '../../providers/prisma/prisma.provider';
import { CreateLocalDto } from './dto/create-local.dto';

@Injectable()
export class LocalService {
  constructor(private readonly prisma: PrismaProvider) {}

  async create(ownerId: string, data: CreateLocalDto): Promise<Local> {
    return this.prisma.local.create({
      data: {
        ownerId,
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
      },
    });
  }

  async findAllByOwner(ownerId: string): Promise<Local[]> {
    return this.prisma.local.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, ownerId: string): Promise<Local> {
    const local = await this.prisma.local.findUnique({ where: { id } });

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

    return local;
  }
}
