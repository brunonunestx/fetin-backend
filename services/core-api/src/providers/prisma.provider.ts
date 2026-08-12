import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaProvider extends PrismaClient implements OnModuleDestroy {
  private readonly logger = new Logger(PrismaProvider.name);

  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    });

    super({ adapter });

    this.$connect().catch((error: unknown) => {
      this.logger.error('Failed to connect to the database', error);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
