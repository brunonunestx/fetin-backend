import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'infra/prisma/schema.prisma',
  migrations: {
    path: 'infra/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
