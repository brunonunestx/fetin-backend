import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'infra/prisma/schema.prisma',
  migrations: {
    path: 'infra/prisma/migrations',
    seed: 'tsx infra/prisma/seed.ts',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
