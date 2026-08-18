import { Injectable } from '@nestjs/common';
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
}
